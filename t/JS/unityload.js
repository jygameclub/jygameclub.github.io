// 标记加载是否完成
var isLoadingDone = true;

// 数据对象，包含错误码和消息
const data = {
  code: 1005,
  msg: "Failed to download resources", // 下载资源失败
};

// 初始化总构建大小
let totalBuildSize = 0;

// 初始化构建文件和捆绑文件的百分比及大小
let buildFilePercentage = 0;
let bundleFilePercentage = 0;
let bundleFileSize = 0;

// 将数据对象转换为JSON字符串
const jsonString = JSON.stringify(data);

// 淡出元素的函数（目前未使用）
function fadeOutElement() {
  // landingPage.style.opacity = "0";
}

// 创建Unity进度条处理器
const initUnityProgressBar = createProgressBarHandler();

// 显示开始按钮的函数
function ShowStartButton() {
  bundleInitialized = true; // 标记捆绑文件已初始化
  // progressBarFull.style.width = "100%";
  // res.innerHTML = "[ Completed ]";
  // landingPage.style.display = "none";
  defaultPercentage = 100; // 设置默认百分比为100%

  clearInterval(IntervalId); // 清除定时器
  IntervalId = null; // 重置定时器ID

  downloadingText.innerHTML = "完成"; // 设置下载完成文本

  // 设置进度条和气泡的位置
  container.style.transform = `translateX(-${100 - defaultPercentage}%)`;
  bubble.style.left = `${defaultPercentage}%`;
  percentage.innerHTML = `${defaultPercentage}%`;

  // 延迟500毫秒后显示开始按钮
  setTimeout(() => {
    startOrDownloading.classList.add("startGameBtn");

    // 添加点击事件监听器以启动游戏
    startOrDownloading.addEventListener("click", () => {
      console.log('开始游戏');
      StartGame();
      console.log("游戏启动中...");
    });
    //startOrDownloading.style.display = "block";
    //loader.style.display = "none";
    //third.style.display = "none"
    //last.style.display = "block"

    // 再次延迟200毫秒后隐藏部分元素并显示开始按钮
    setTimeout(() => {
      downloadingText.style.display = "none";
      startOrDownloading.style.display = "flex";
      loadingWrapper.style.display = "none";
      bubble.style.display = "none";
      pinLoader.style.display = "none";
    }, 200);
  }, 500);

  //background.style.display = "block";
}

// 启动游戏的函数
function StartGame() {
  loadingScreen.style.display = "none"; // 隐藏加载屏幕
  myGameInstance.SendMessage("[ Callback ]", "GetStarted", ""); // 发送消息以启动游戏
  gameCanvas.style.display = "block"; // 显示游戏画布
}

// 更新加载进度条的函数
function UpdateLoadingProgresBar(progress) {
  const percentageBar = Math.round(progress * 100); // 计算百分比

  if (progress < 0.9) {
    defaultPercentage = 1; // 进度低于90%时设置默认百分比为1%
  } else {
    // 进度达到90%时，假设解压开始
    //defaultPercentage = 90;
  }

  // 更新进度条和气泡的位置
  container.style.transform = `translateX(-${100 - defaultPercentage}%)`;
  bubble.style.left = `${defaultPercentage}%`;
  percentage.innerHTML = `${defaultPercentage}%`;
}

// 创建进度条处理器的函数
function createProgressBarHandler() {
  let isCounting = false;
  let Counted = false;
  let wasmProgress = 0; // 跟踪WASM下载进度的变量
  let retryAttempts = 0; // 重试次数计数器
  const maxRetries = 5; // 最大重试次数
  let isOnline = navigator.onLine; // 跟踪在线/离线状态
  let isPaused = false; // 标记下载是否暂停
  let defaultPercentage = 1; // 跟踪默认百分比

  const defaultTotalBuildSize = 6 * 1024 * 1024; // 默认总构建大小，6MB

  // 获取随机时间间隔的函数
  const getRandomInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // 记录文件大小的异步函数
  async function logFileSizes(resolve, reject) {
    totalBuildSizeInKb = 0;
    totalBuildSize = 0;

    var allFiles = contentToCache;

    // 如果allFiles中不包含assetBundleLink，则添加
    if (!allFiles.includes(assetBundleLink)) {
      allFiles.push(assetBundleLink);
    }

    console.log("缓存内容:", contentToCache);
    for (const file of contentToCache) {
      try {
        const response = await fetch(file, { method: "HEAD" });
        if (!response.ok) {
          throw new Error(`无法获取 ${file}: ${response.statusText}`);
        }
        const fileSize = response.headers.get("Content-Length");

        if (fileSize) {
          const sizeInBytes = parseInt(fileSize, 10);
          totalBuildSize += sizeInBytes; // 累加文件大小
          console.log(`文件: ${file}, 大小: ${sizeInBytes} 字节`);

          if (file == assetBundleLink) {
            bundleFileSize = sizeInBytes; // 设置捆绑文件大小
          }
        } else {
          console.log(`文件: ${file}, 大小不可用`);
        }
      } catch (error) {
        console.error(`获取文件大小失败: ${error.message}`);
      }
    }

    // 如果总构建大小小于捆绑文件大小加默认大小，则加上默认大小
    if (totalBuildSize < (bundleFileSize + defaultTotalBuildSize)) {
      totalBuildSize += defaultTotalBuildSize;
    }

    totalBuildSizeInKb = totalBuildSize / 1024; // 转换为KB
    console.log("总构建大小 (KB):", totalBuildSizeInKb);
    bundleFilePercentage = Math.floor((bundleFileSize / totalBuildSize) * 100);
    buildFilePercentage = 100 - bundleFilePercentage;

    FakeLoadingProgress(); // 启动假加载进度

    console.log("总构建大小:", totalBuildSize);
    console.log("构建文件百分比:", buildFilePercentage);
    console.log("捆绑文件百分比:", bundleFilePercentage);

    // 重试初始化Unity
    retryInitializeUnity(canvas, config, resolve, reject);
  }

  // 处理进度的函数
  const handleProgress = (progress) => {
    if (!stopUnity) {
      var currentDownloadedSize =
        progress * (totalBuildSizeInKb * (buildFilePercentage / 100));

      var currentPercentage = (currentDownloadedSize / totalBuildSizeInKb) * 100;
      //console.log("进度:", progress);
      const width = Math.round(progress * 100);

      if (currentPercentage > defaultPercentage) {
        if (lastPercentage < currentPercentage) {
          if (!isPaused && width > lastPercentage) {
            // 仅在未暂停且宽度大于上次百分比时更新进度
            container.style.transform = `translateX(-${100 - currentPercentage}%)`;
            bubble.style.left = `${currentPercentage}%`;
            percentage.innerHTML = `${currentPercentage.toFixed(0)}%`;
            lastPercentage = currentPercentage; // 保存最后的进度值

            if (!fakeLoadingStarted || fakeLoadingProgress < currentPercentage) {
              downloadingResText.innerHTML = downloadingResources;
              downloadedValue.innerHTML = currentDownloadedSize.toFixed(2);
              downloadTotal.innerHTML = "kb/" + totalBuildSizeInKb.toFixed(2) + "kb";
              downloadedValue.style.width = (downloadTotal.clientWidth - 30) + "px";
            }

            // 打印真实进度日志
            console.log("真实进度:", currentPercentage.toFixed(0) + "%");
          }
        }
      }
    }
  };

  let fakeInitialized = false;

  // 假加载进度的函数
  function FakeLoadingProgress() {
    console.log("启动假加载进度");

    // 如果尚未初始化假加载，进行初始化
    if (!fakeInitialized) {
      downloadingResText.innerHTML = downloadingResources; // 设置下载资源文本
      downloadedValue.innerHTML = (1).toFixed(2); // 初始化已下载值为1
      downloadTotal.innerHTML = "kb/" + totalBuildSizeInKb.toFixed(2) + "kb"; // 设置总下载大小
      downloadedValue.style.width = (downloadTotal.clientWidth - 30) + "px"; // 调整下载进度条宽度
      fakeInitialized = true; // 标记假加载已初始化
    }

    var intervalTime = 10000; // 初始时间间隔为10秒

    // 如果已经有定时器在运行，避免重复设置
    if (IntervalId) {
      console.log("假加载定时器已存在，跳过设置新的定时器。");
      return;
    }

    // 定义一个内部函数来处理假加载进度
    function updateFakeProgress() {
      // 根据当前进度百分比设置下一个时间间隔
      if (lastPercentage < 50) {
        intervalTime = getRandomInterval(10000, 11000); // 10-11秒
      } else {
        intervalTime = getRandomInterval(12000, 14000); // 12-14秒
      }

      // 标记假加载已开始
      fakeLoadingStarted = true;
      // 打印假加载的暂停状态和开始状态，用于调试
      console.log("假加载暂停状态:", isPaused, "开始假加载:", startFakeLoading);

      // 检查是否需要进行假加载
      if (startFakeLoading && !isPaused && lastPercentage < 99) {
        // 如果假加载进度大于上次记录的百分比，更新lastPercentage
        if (fakeLoadingProgress > lastPercentage) {
          lastPercentage = fakeLoadingProgress;
        } else {
          // 否则，将假加载进度设置为lastPercentage，确保进度不倒退
          fakeLoadingProgress = lastPercentage;
        }

        // 增加假加载进度，但不超过99%
        fakeLoadingProgress = Math.min(fakeLoadingProgress + 1, 99);
        // 更新进度条和气泡的位置
        container.style.transform = `translateX(-${100 - lastPercentage}%)`;
        bubble.style.left = `${lastPercentage}%`;
        percentage.innerHTML = `${lastPercentage.toFixed(0)}%`;

        // 计算当前已下载大小
        var currentDownloadedSize = (lastPercentage / 100) * totalBuildSizeInKb;

        // 更新下载相关的文本和进度条
        downloadingResText.innerHTML = downloadingResources;
        downloadedValue.innerHTML = currentDownloadedSize.toFixed(2);
        downloadTotal.innerHTML = "kb/" + totalBuildSizeInKb.toFixed(2) + "kb";
        downloadedValue.style.width = (downloadTotal.clientWidth - 30) + "px";

        // 打印假进度日志
        console.log("1假进度:", lastPercentage.toFixed(0) + "%");
      }

      // 重新设置下一个定时器
      IntervalId = setTimeout(() => {
        IntervalId = null; // 重置定时器ID
        updateFakeProgress(); // 递归调用以继续假加载
      }, intervalTime);
    }

    // 开始假加载进度更新
    updateFakeProgress();
  }
  // 判断是否有网络连接
const isServerAvailable = async () => {
  try {
     //const baseUrl = `${window.location.origin}/`;
    const response = await fetch("https://jygameclub.github.io/t/", {
      method: "GET",
      timeout: 5000, // 设置请求超时，5秒
    });
    if (response.ok) {
      return true; // 服务器响应正常
    }
    return false; // 服务器没有正常响应
  } catch (error) {
    console.error("网络错误或服务器不可用:", error);
    return false; // 网络或服务器不可用
  }
};

// 重试初始化Unity的函数
const retryInitializeUnity = async (canvas, config, resolve, reject) => {
  console.log("重试初始化JyUnity的函数 retryAttempts=" + retryAttempts);

  // 判断服务器是否可用
  const serverAvailable = await isServerAvailable();

  if (!serverAvailable) {
    console.error("JyUnity服务器不可用，无法进行初始化。");
    // 如果服务器不可用，延迟重试
    setTimeout(() => {
      retryInitializeUnity(canvas, config, resolve, reject);
    }, 1000); // 2秒后重试
    return; // 直接返回，避免继续执行后面的代码
  } else {
    console.log("JyUnity服务器可用。");
  }

  createUnityInstance(canvas, config, handleProgress)
    .then((unityInstance) => {
      console.log("重试初始化JyUnity的函数 then retryAttempts=" + retryAttempts);
      myGameInstance = unityInstance;
      if (stopUnity) myGameInstance.Quit();
      unityInitialized = true; // 标记Unity已初始化
      console.log("JyUnity实例创建成功");
      resolve(); // Unity初始化成功
    })
    .catch((message) => {
      console.log("重试初始化JyUnity的函数 catch retryAttempts=" + retryAttempts);
      console.error("JyUnity实例创建失败:", message);

      // 如果达到最大重试次数，拒绝Promise
      if (retryAttempts < maxRetries) {
        retryAttempts++;
        console.log(`重试初始化JyUnity，尝试次数: ${retryAttempts}`);
        setTimeout(() => {
          retryInitializeUnity(canvas, config, resolve, reject);
        }, 3000); // 每10秒重试一次
      } else {
        console.error("达到最大重试次数，初始化JyUnity失败。");
        reject(message);
      }
    });
};

  // 初始化Unity的函数，返回一个Promise
  const initializeUnity = (canvas, config) => {
    return new Promise((resolve, reject) => {
      if (!unityInitialized) {
        logFileSizes(resolve, reject); // 如果未初始化，则记录文件大小
      } else {
        resolve(); // 如果已初始化，直接解决Promise
      }
    });
  };

  // 监听在线事件
  window.addEventListener("online", () => {
    console.log("网络连接已恢复");
    isOnline = true;
    totalBuildSizeInKb = 0;

    if (isPaused) {
      console.log("尝试恢复下载...");
      // 仅在未初始化Unity时重新初始化
      if (!unityInitialized) {
        initializeUnity(canvas, config)
          .then(() => {
            console.log("Unity已成功恢复初始化。");
          })
          .catch((error) => {
            console.error("恢复Unity初始化失败:", error);
          });
      }
      isPaused = false; // 取消暂停标志
    }
  });

  // 监听离线事件
  window.addEventListener("offline", () => {
    console.log("网络连接已断开");
    isOnline = false;
    isPaused = true; // 标记下载或初始化为暂停
    // 保持进度条在最后一个百分比
    clearInterval(IntervalId);
    clearTimeout(IntervalId); // 确保清除 setTimeout
    IntervalId = null;
    container.style.transform = `translateX(-${100 - lastPercentage}%)`;
    bubble.style.left = `${lastPercentage}%`;
    percentage.innerHTML = `${lastPercentage.toFixed(0)}%`;
    console.log("下载已暂停，等待网络恢复...");
  });

  // 返回一个函数，用于处理脚本加载
  return function (script) {
    script.onload = () => {
      initializeUnity(canvas, config)
        .then(() => {
          console.log("Unity已成功初始化。");
        })
        .catch((error) => {
          if (!unityInitialized) {
            CheckResponseCodeHtml(jsonString);
            console.error("初始化Unity失败:", error);
          }
        });
    };

    document.body.appendChild(script); // 将脚本添加到文档中
  };
}

// 更新加载进度的函数
function UpdateLoadingProgress(progress) {
  // 计算当前已下载的大小
  var currentDownloadedSize =
    progress * (totalBuildSizeInKb * (bundleFilePercentage / 100)) +
    (totalBuildSizeInKb - bundleFileSize / 1024);

  // 计算当前进度百分比
  var currentPercentage = (currentDownloadedSize / totalBuildSizeInKb) * 100;

  console.log("接收到的进度:", (progress * 100).toFixed(2) + "%");
  console.log("计算得到的当前下载大小 (KB):", currentDownloadedSize.toFixed(2));
  console.log("计算得到的当前进度百分比:", currentPercentage.toFixed(2) + "%");

  // 判断当前百分比是否大于默认百分比
  if (currentPercentage > defaultPercentage) {
    console.log(`当前百分比 (${currentPercentage.toFixed(2)}%) 大于默认百分比 (${defaultPercentage}%)`);
    
    // 判断上次记录的百分比是否小于当前百分比
    if (lastPercentage < currentPercentage) {
      console.log(`上次百分比 (${lastPercentage}%) 小于当前百分比 (${currentPercentage}%)`);

      // 更新进度条的视觉效果
      container.style.transform = `translateX(-${100 - currentPercentage}%)`;
      bubble.style.left = `${currentPercentage}%`;
      percentage.innerHTML = `${currentPercentage.toFixed(0)}%`;
      console.log(`进度条位置更新: translateX(-${100 - currentPercentage}%)`);
      console.log(`气泡位置更新: left = ${currentPercentage}%`);
      console.log(`百分比显示更新: ${currentPercentage.toFixed(0)}%`);

      // 更新上次记录的百分比
      lastPercentage = currentPercentage;
      console.log(`更新后的上次百分比: ${lastPercentage}%`);

      // 判断是否需要更新下载相关的UI元素
      if (!fakeLoadingStarted || fakeLoadingProgress < currentPercentage) {
        console.log(`条件满足: !fakeLoadingStarted (${!fakeLoadingStarted}) 或 fakeLoadingProgress (${fakeLoadingProgress}%) < currentPercentage (${currentPercentage}%)`);
        
        downloadingResText.innerHTML = downloadingResources;
        downloadedValue.innerHTML = currentDownloadedSize.toFixed(2);
        downloadTotal.innerHTML = "kb/" + totalBuildSizeInKb.toFixed(2) + "kb";
        downloadedValue.style.width = (downloadTotal.clientWidth - 30) + "px";
        
        console.log("更新下载资源文本:", downloadingResources);
        console.log("更新已下载值:", currentDownloadedSize.toFixed(2) + "KB");
        console.log("更新总下载大小:", "kb/" + totalBuildSizeInKb.toFixed(2) + "kb");
        console.log("调整下载进度条宽度:", (downloadTotal.clientWidth - 30) + "px");
      } else {
        console.log(`不满足更新下载UI的条件: fakeLoadingStarted (${fakeLoadingStarted}) 且 fakeLoadingProgress (${fakeLoadingProgress}%) >= currentPercentage (${currentPercentage}%)`);
      }

      // 打印真实进度日志
      console.log("真实进度1:", currentPercentage.toFixed(0) + "%");
    } else {
      console.log(`上次百分比 (${lastPercentage}%) 不小于当前百分比 (${currentPercentage}%)，无需更新进度条。`);
    }
  } else {
    console.log(`当前百分比 (${currentPercentage.toFixed(2)}%) 不大于默认百分比 (${defaultPercentage}%)，无需更新进度条。`);
  }
}


// 资产加载完成的函数
function AssetLoadingDone() {
  downloadingText.innerHTML = "解压纹理中...."; // 设置解压纹理文本
  downloadedValue.innerHTML = totalBuildSizeInKb.toFixed(2); // 显示总下载大小
  downloadTotal.innerHTML = "kb/" + totalBuildSizeInKb.toFixed(2) + "kb"; // 显示总下载大小
  downloadedValue.style.width = (downloadTotal.clientWidth - 30) + "px"; // 调整下载进度条宽度
  console.log("资产加载完成，解压纹理中...");
}
