// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const compressionControls = document.getElementById('compressionControls');
const previewContainer = document.getElementById('previewContainer');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');
const progressInfo = document.getElementById('progressInfo');
const currentProgress = document.getElementById('currentProgress');
const totalImages = document.getElementById('totalImages');
const imageList = document.getElementById('imageList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const startCompressBtn = document.getElementById('startCompressBtn');
const originalImageList = document.getElementById('originalImageList');
const compressedImagesGrid = document.getElementById('compressedImagesGrid');

let originalImage = null;
let compressedImages = []; // 存储压缩后的图片信息
let selectedFiles = []; // 存储选择的文件

// 处理文件拖放
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).slice(0, 10);
    handleMultipleImages(files);
});

// 处理点击上传
uploadArea.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    handleMultipleImages(files);
});

// 处理多张图片
async function handleMultipleImages(files) {
    if (files.length === 0) return;
    
    // 重置状态
    selectedFiles = files;
    compressedImages = [];
    originalImageList.innerHTML = '';
    imageList.innerHTML = '';
    
    // 显示控制区域
    compressionControls.style.display = 'block';
    previewContainer.style.display = 'grid';
    compressedImagesGrid.style.display = 'none';
    
    // 显示原始图片预览
    files.forEach((file, index) => {
        createOriginalPreview(file, index);
    });
}

// 添加原始图片预览函数
function createOriginalPreview(file, index) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${e.target.result}" alt="${file.name}">
            <div class="image-info">
                <div class="image-name">${file.name}</div>
                <div class="size-info">
                    <span>大小：${formatFileSize(file.size)}</span>
                </div>
            </div>
        `;
        originalImageList.appendChild(imageItem);
    };
    reader.readAsDataURL(file);
}

// 处理单张图片
function processImage(file, index) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const compressed = compressImage(img);
                createImagePreview(file, compressed, index);
                compressedImages.push({
                    name: file.name,
                    data: compressed
                });
                resolve();
            };
        };
        reader.readAsDataURL(file);
    });
}

// 压缩图片（修改现有的compressImage函数）
function compressImage(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.drawImage(image, 0, 0);
    
    const quality = qualitySlider.value / 100;
    return canvas.toDataURL('image/jpeg', quality);
}

// 创建图片预览
function createImagePreview(originalFile, compressedDataUrl, index) {
    const originalSize = originalFile.size;
    const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
    const compressionRate = Math.round((1 - compressedSize / originalSize) * 100);
    
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.innerHTML = `
        <img src="${compressedDataUrl}" alt="${originalFile.name}">
        <span class="compression-rate">压缩${compressionRate}%</span>
        <div class="image-info">
            <div class="image-name">${originalFile.name}</div>
            <div class="size-info">
                <span>原始：${formatFileSize(originalSize)}</span>
                <span>压缩后：${formatFileSize(compressedSize)}</span>
            </div>
        </div>
        <button class="download-btn" onclick="downloadImage(${index})">下载此图片</button>
    `;
    
    imageList.appendChild(imageItem);
}

// 下载单张图片
function downloadImage(index) {
    const image = compressedImages[index];
    const link = document.createElement('a');
    link.download = `compressed-${image.name}`;
    link.href = image.data;
    link.click();
}

// 批量下载所有图片
downloadAllBtn.addEventListener('click', async () => {
    // 需要引入JSZip库来实现打包下载
    const JSZip = window.JSZip;
    if (!JSZip) {
        alert('正在加载打包功能，请稍后再试...');
        return;
    }
    
    const zip = new JSZip();
    
    compressedImages.forEach((image, index) => {
        const imageData = image.data.split(',')[1];
        zip.file(`compressed-${image.name}`, imageData, {base64: true});
    });
    
    const content = await zip.generateAsync({type: 'blob'});
    const link = document.createElement('a');
    link.download = 'compressed-images.zip';
    link.href = URL.createObjectURL(content);
    link.click();
});

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 添加开始压缩按钮事件
startCompressBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    compressedImages = [];
    imageList.innerHTML = '';
    progressInfo.style.display = 'block';
    compressedImagesGrid.style.display = 'block';
    
    totalImages.textContent = selectedFiles.length;
    
    // 处理每张图片
    for (let i = 0; i < selectedFiles.length; i++) {
        currentProgress.textContent = i + 1;
        await processImage(selectedFiles[i], i);
    }
    
    progressInfo.style.display = 'none';
});

// 修改质量滑块变化事件
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value + '%';
}); 