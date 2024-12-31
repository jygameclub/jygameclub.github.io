using System;
using System.Collections;
using System.Linq;
using System.Runtime.InteropServices;
using NaughtyAttributes;
using UnityEngine;
using UnityEngine.Analytics;
using UnityEngine.Networking;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class AssetBundleLoader : MonoBehaviour
{
    // 标记加载是否完成
    private bool m_isAssetBundleLoaded = false;

    [Header("StreamingAssets AssetBundle Settings")]
    [SerializeField]
    [ReadOnly]
    private string m_BundleName;

    [SerializeField]
    [Space]
    private string m_DebugBundleName;

    private string m_LocalBundlePath;

    private string url;

#if UNITY_WEBGL
    [DllImport("__Internal")]
    private static extern void GetAssetLinkFromWeb();

    [DllImport("__Internal")]
    private static extern void UpdateLoadingProgress(float value);

    [DllImport("__Internal")]
    private static extern void CheckErrorResponseCode(string value);

    [DllImport("__Internal")]
    private static extern void AssetBundleLoadingDone();
#endif

    [SerializeField]
    private ErrorHandlerScriptable m_errorScriptable;

    private ErrorHandlerConfig m_errorResponse;
    private WaitForSeconds m_RetryDelay;
    private string Error = "Failed to download resources";

    private bool canRetryLoading;

    // 重连相关变量
    private int retryAttempts = 0; // 当前重试次数
    private const int maxRetries = 50; // 最大重试次数
    private const float retryInterval = 5f; // 重试间隔时间（秒）

    private void Start()
    {
        Debug.Log("下载进度 void start LoadBundles");
        Analytics.enabled = false;
        canRetryLoading = true;

#if UNITY_WEBGL && !UNITY_EDITOR
        // 从Web获取Asset Bundle链接
        GetAssetLinkFromWeb();
#else
        // 调试模式加载Asset Bundle
        DebugLoadBundle();
#endif
        m_RetryDelay = new WaitForSeconds(2);
        m_errorResponse = m_errorScriptable.GetErrorHandlerConfigList().ToList().First(x => x.errorResponse.msg == Error);
    }

    /// <summary>
    /// 设置Asset Bundle链接，并开始加载
    /// </summary>
    /// <param name="linkUrl">Asset Bundle的链接URL</param>
    public void SetAssetBundleLink(string linkUrl)
    {
        url = linkUrl;
        LoadAssetBundleFromAWS(linkUrl);
    }

    /// <summary>
    /// 调试模式加载Asset Bundle
    /// </summary>
    private void DebugLoadBundle()
    {
        LoadAssetBundleFromAWS(m_DebugBundleName);
    }

    [Button]
    private void LoadAssetBundleFromStreamingAssets(string i_BundleName)
    {
        m_LocalBundlePath = System.IO.Path.Combine(Application.streamingAssetsPath, i_BundleName);
        StartCoroutine(LoadBundles());
    }

    [Button]
    private void LoadAssetBundleFromAWS(string link)
    {
        url = link;
        StartCoroutine(LoadBundles());
    }

    /// <summary>
    /// 停止加载Asset Bundle
    /// </summary>
    public void StopLoadingBundle()
    {
        canRetryLoading = false;
    }

    /// <summary>
    /// 加载Asset Bundle的协程
    /// </summary>
    private IEnumerator LoadBundles()
    {
        //这里是unity 创建成功的标志 哪怕断网了，恢复后也能继续进行

        //实例创建成功
        Debug.Log("下载进度 start LoadBundles start ");
        UnityWebRequest uwr = UnityWebRequestAssetBundle.GetAssetBundle(url);

        uwr.SendWebRequest();
        while (!uwr.isDone)
        {
            if (canRetryLoading)
            {
                float assetBundleProgress = Mathf.Clamp01(uwr.downloadProgress / 0.9f); // AssetBundle进度
                float totalProgress = 0.5f + (assetBundleProgress * 0.5f); // 总进度（0.5为Unity初始化，0.5为AssetBundle下载）

#if UNITY_WEBGL && !UNITY_EDITOR
                UpdateLoadingProgress(totalProgress); // 更新加载进度（WebGL）
#endif
                // 打印下载进度日志
                Debug.Log($"下载进度: {totalProgress * 100:F2}%");
            }
            Debug.Log("下载进度 canRetryLoading="+canRetryLoading);
            yield return null;
        }

        // 检查下载是否成功
        if (uwr.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"AssetBundle下载失败: {uwr.error}");///这个时候已经下载完成了 这里是服务器断开以后可以重试解压的逻辑 服务器或者网络恢复以后开始继续解压 下载

            if (canRetryLoading && retryAttempts < maxRetries)
            {
                retryAttempts++;
                Debug.LogWarning($"尝试重连加载AssetBundle，尝试次数: {retryAttempts}/{maxRetries}");
                yield return new WaitForSeconds(retryInterval);
                yield return LoadBundles(); // 递归调用协程进行重连
            }
            else
            {
                Debug.LogError("达到最大重试次数，停止加载AssetBundle。");
                CheckErrorResponse(); // 处理错误响应
                yield break; // 停止协程
            }
        }
        else
        {
            AssetBundle bundle = DownloadHandlerAssetBundle.GetContent(uwr);

            if (bundle != null)
            {
#if UNITY_WEBGL && !UNITY_EDITOR
                AssetBundleLoadingDone(); // AssetBundle加载完成通知（WebGL）
#endif
                string[] scenePaths = bundle.GetAllScenePaths();

                if (scenePaths.Length > 0)
                {
                    string scenePath = scenePaths[0];
                    AsyncOperation asyncOperation = SceneManager.LoadSceneAsync(
                        scenePath,
                        LoadSceneMode.Single
                    );

                    yield return asyncOperation;

                    if (asyncOperation.isDone)
                    {
                        Debug.Log($"场景 {scenePath} 已成功从AssetBundle加载。");
                    }
                    else
                    {
                        Debug.LogError($"无法从AssetBundle加载场景 {scenePath}。");
                    }
                }
                else
                {
                    Debug.LogError($"AssetBundle中未找到任何场景 ({m_LocalBundlePath})");
                }

                bundle.Unload(false);
                m_isAssetBundleLoaded = true;
            }
            else
            {
                Debug.LogError("无法从StreamingAssets加载AssetBundle。");
                m_isAssetBundleLoaded = false;
            }
        }
    }

    /// <summary>
    /// 处理错误响应
    /// </summary>
    private void CheckErrorResponse()
    {
        // 根据您的错误处理逻辑，调用相关方法或显示错误信息
        // 例如：
        Debug.LogError("处理AssetBundle加载错误响应。");
        // 可以调用您的ErrorHandlerScriptable或其他错误处理逻辑
    }

//#if UNITY_WEBGL && !UNITY_EDITOR
//    /// <summary>
//    /// 从Web获取Asset Bundle链接的回调函数
//    /// </summary>
//    public void OnGetAssetLinkFromWeb(string linkUrl)
//    {
//        SetAssetBundleLink(linkUrl);
//    }

//    /// <summary>
//    /// 从Web获取错误响应码的回调函数
//    /// </summary>
//    public void OnCheckErrorResponseCode(string code)
//    {
//        CheckErrorResponseCode(code);
//    }
//#endif
}
