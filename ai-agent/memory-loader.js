// memory-loader.js
// 모든 전략/설정/코드/성과 파일을 자동으로 탐색, 읽고, 메모리화하는 모듈
// file-index.json을 참고하여 주요 파일을 자동 로드

const fs = require('fs');
const path = require('path');

function loadFileList(indexPath = path.join(__dirname, 'file-index.json')) {
  if (!fs.existsSync(indexPath)) return [];
  return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
}

function loadAllFiles() {
  const fileList = loadFileList();
  const files = {};
  fileList.forEach(file => {
    try {
      files[file.path] = fs.readFileSync(path.resolve(__dirname, '..', file.path), 'utf-8');
    } catch (e) {
      files[file.path] = null;
    }
  });
  return files;
}

module.exports = { loadFileList, loadAllFiles };