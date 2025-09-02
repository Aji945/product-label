function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('在地人團購－現貨查詢表')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function getSheetData() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  var data = {};
  
  sheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    var range = sheet.getDataRange();
    var values = range.getValues();
    
    // 假設第一行是標題
    var headers = values.shift();
    
    data[sheetName] = values.map(function(row) {
      var imageUrl = '';
      if (row[0]) {
        // 處理 A 欄的圖片 URL
        var match = row[0].match(/id=([^&]+)/);
        if (match) {
          var fileId = match[1];
          imageUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1366";
        }
      }
      return {
        imageUrl: imageUrl,
        name: row[1],
        price: row[2],
        quantity: row[3],
        driveLink: row[4]
      };
    });
  });
  
  return data;
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('自訂工具')
    .addItem('格式化工作表', 'formatSheets')
    .addItem('比對商品-蝦皮', 'compareProducts')
    .addItem('比對商品-momo', 'compareMomoProducts')
    .addToUi();
}

function formatSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  sheets.forEach(function(sheet) {
    var range = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());

    // 設定文字大小
    range.setFontSize(16);

    // 設定列高
    sheet.setRowHeights(1, sheet.getMaxRows(), 41);

    // 設定欄位寬度
    sheet.setColumnWidth(1, 306);  // A欄
    sheet.setColumnWidth(2, 235);  // B欄
    sheet.setColumnWidth(3, 226);  // C欄
    sheet.setColumnWidth(4, 143);   // D欄
    sheet.setColumnWidth(5, 98);   // E欄
    sheet.setColumnWidth(6, 115);  // F欄
    sheet.setColumnWidth(7, 115);  // G欄
    sheet.setColumnWidth(8, 115);  // H欄

  // 設定其他範圍靠左對齊
  range.setHorizontalAlignment("left");

  // 設定A1為置中對齊
  var a1Range = sheet.getRange("A1:E1");
  a1Range.setHorizontalAlignment("center");

 
  });
}

function compareProducts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 獲取總表和蝦皮表
  var masterSheet = ss.getSheetByName('總表');
  var shopeeSheet = ss.getSheetByName('蝦皮');
  
  if (!masterSheet || !shopeeSheet) {
    SpreadsheetApp.getUi().alert('請確認存在「總表」和「蝦皮」工作表');
    return;
  }
  
  // 讀取資料
  var masterData = masterSheet.getDataRange().getValues();
  var shopeeData = shopeeSheet.getDataRange().getValues();
  
  // 移除標題行
  masterData.shift();
  shopeeData.shift();
  
  // 取得商品名稱
  var masterProducts = masterData.map(function(row) { return row[1]; }).filter(function(item) { return item; });
  var shopeeProducts = shopeeData.map(function(row) { return row[0]; }).filter(function(item) { return item; });
  
  // 分類結果
  var masterOnly = [];
  var shopeeOnly = [];
  var bothHave = [];
  var neitherHave = [];
  
  // 1. 總表有，蝦皮沒有的
  masterProducts.forEach(function(masterProduct) {
    var found = false;
    shopeeProducts.forEach(function(shopeeProduct) {
      if (isProductMatch(masterProduct, shopeeProduct)) {
        found = true;
      }
    });
    if (!found) {
      masterOnly.push(masterProduct);
    }
  });
  
  // 2. 蝦皮有，總表沒有的
  shopeeProducts.forEach(function(shopeeProduct) {
    var found = false;
    masterProducts.forEach(function(masterProduct) {
      if (isProductMatch(masterProduct, shopeeProduct)) {
        found = true;
      }
    });
    if (!found) {
      shopeeOnly.push(shopeeProduct);
    }
  });
  
  // 3. 兩個都有的
  var matchedPairs = [];
  masterProducts.forEach(function(masterProduct) {
    shopeeProducts.forEach(function(shopeeProduct) {
      if (isProductMatch(masterProduct, shopeeProduct)) {
        matchedPairs.push(masterProduct + ' | ' + shopeeProduct);
      }
    });
  });
  
  // 建立或更新比對表
  var compareSheet = ss.getSheetByName('比對表');
  if (compareSheet) {
    compareSheet.clear();
  } else {
    compareSheet = ss.insertSheet('比對表');
  }
  
  // 寫入標題
  compareSheet.getRange(1, 1, 1, 4).setValues([['總表有，蝦皮沒有', '蝦皮有，總表沒有', '兩個都有', '兩個都沒有']]);
  
  // 找出最大長度
  var maxLength = Math.max(masterOnly.length, shopeeOnly.length, matchedPairs.length, neitherHave.length);
  
  // 準備資料陣列
  var dataToWrite = [];
  for (var i = 0; i < maxLength; i++) {
    dataToWrite.push([
      masterOnly[i] || '',
      shopeeOnly[i] || '',
      matchedPairs[i] || '',
      neitherHave[i] || ''
    ]);
  }
  
  // 寫入資料
  if (dataToWrite.length > 0) {
    compareSheet.getRange(2, 1, dataToWrite.length, 4).setValues(dataToWrite);
  }
  
  // 格式化標題行
  var headerRange = compareSheet.getRange(1, 1, 1, 4);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#E8F4FD');
  
  SpreadsheetApp.getUi().alert('比對完成！結果已寫入「比對表」');
}

function isProductMatch(masterProduct, shopeeProduct) {
  if (!masterProduct || !shopeeProduct) return false;
  
  // 將兩個商品名稱都轉為小寫並移除空格
  var master = masterProduct.toString().toLowerCase().replace(/\s+/g, '');
  var shopee = shopeeProduct.toString().toLowerCase().replace(/\s+/g, '');
  
  // 檢查總表商品名稱是否包含在蝦皮商品名稱中
  return shopee.includes(master) || master.includes(shopee);
}

function compareMomoProducts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 獲取總表和momo表
  var masterSheet = ss.getSheetByName('總表');
  var momoSheet = ss.getSheetByName('momo');
  
  if (!masterSheet || !momoSheet) {
    SpreadsheetApp.getUi().alert('請確認存在「總表」和「momo」工作表');
    return;
  }
  
  // 讀取資料
  var masterData = masterSheet.getDataRange().getValues();
  var momoData = momoSheet.getDataRange().getValues();
  
  // 移除標題行
  masterData.shift();
  momoData.shift();
  
  // 取得商品名稱
  var masterProducts = masterData.map(function(row) { return row[2]; }).filter(function(item) { return item; });
  var momoProducts = momoData.map(function(row) { 
    var fullText = row[0];
    if (fullText && fullText.toString().includes('】')) {
      return fullText.toString().split('】')[1].trim();
    }
    return fullText;
  }).filter(function(item) { return item; });
  
  // 分類結果
  var masterOnly = [];
  var momoOnly = [];
  var bothHave = [];
  var neitherHave = [];
  
  // 1. 總表有，momo沒有的
  masterProducts.forEach(function(masterProduct) {
    var found = false;
    momoProducts.forEach(function(momoProduct) {
      if (isProductMatch(masterProduct, momoProduct)) {
        found = true;
      }
    });
    if (!found) {
      masterOnly.push(masterProduct);
    }
  });
  
  // 2. momo有，總表沒有的
  momoProducts.forEach(function(momoProduct) {
    var found = false;
    masterProducts.forEach(function(masterProduct) {
      if (isProductMatch(masterProduct, momoProduct)) {
        found = true;
      }
    });
    if (!found) {
      momoOnly.push(momoProduct);
    }
  });
  
  // 3. 兩個都有的
  var matchedPairs = [];
  masterProducts.forEach(function(masterProduct) {
    momoProducts.forEach(function(momoProduct) {
      if (isProductMatch(masterProduct, momoProduct)) {
        matchedPairs.push(masterProduct + ' | ' + momoProduct);
      }
    });
  });
  
  // 建立或更新比對表
  var compareSheet = ss.getSheetByName('momo比對表');
  if (compareSheet) {
    compareSheet.clear();
  } else {
    compareSheet = ss.insertSheet('momo比對表');
  }
  
  // 寫入標題
  compareSheet.getRange(1, 1, 1, 4).setValues([['總表有，momo沒有', 'momo有，總表沒有', '兩個都有', '兩個都沒有']]);
  
  // 找出最大長度
  var maxLength = Math.max(masterOnly.length, momoOnly.length, matchedPairs.length, neitherHave.length);
  
  // 準備資料陣列
  var dataToWrite = [];
  for (var i = 0; i < maxLength; i++) {
    dataToWrite.push([
      masterOnly[i] || '',
      momoOnly[i] || '',
      matchedPairs[i] || '',
      neitherHave[i] || ''
    ]);
  }
  
  // 寫入資料
  if (dataToWrite.length > 0) {
    compareSheet.getRange(2, 1, dataToWrite.length, 4).setValues(dataToWrite);
  }
  
  // 格式化標題行
  var headerRange = compareSheet.getRange(1, 1, 1, 4);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#E8F4FD');
  
  SpreadsheetApp.getUi().alert('momo比對完成！結果已寫入「momo比對表」');
}

