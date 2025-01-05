document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault(); // フォーム送信を防ぐ

    const date = document.getElementById('date').value; // 入力された日付
    const value = parseFloat(document.getElementById('number').value); // 入力された数値 (数値に変換)

    // クライアント側でデータを送信
    fetch('http://localhost:3000/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',  // JSONデータを送信
        },
        body: JSON.stringify({ date: date, value: value })  // 送信するデータ
    })
    .then(response => response.json())  // レスポンスをJSON形式で取得
    .then(data => {
        console.log('保存成功:', data);
        // データが保存された後にグラフを更新
        // 既存のデータに新しいデータを追加
        dates.push(date);
        values.push(value);
        drawGraph(dates, values);  // 新しいデータでグラフ更新
    })
    .catch(error => {
        console.error('保存エラー:', error);  // エラー処理
    });
});

// 初期のデータを保持
let dates = [];
let values = [];

// ページロード時に保存されたデータを取得してグラフを描画
window.onload = function() {
    fetch('http://localhost:3000/getData')
        .then(response => response.json())
        .then(data => {
            // 取得したデータをグラフ用に整形
            dates = data.map(entry => entry.date);
            values = data.map(entry => entry.value);
            if(dates.length>0){
                drawGraph(dates, values); // グラフを描画
            }else{
                console.log('グラフ描画するデータがありません')
            }
            })
        .catch(error => console.error('データ取得エラー:', error));
};

// グラフ描画関数
let chartInstance = null;
function drawGraph(dates, values) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    if (chartInstance) {
        chartInstance.destroy(); // 既存のインスタンスを破棄
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,  // X軸は日付
            datasets: [{
                label: '入力された数値',
                data: values,  // Y軸は数値
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '日付'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '数値'
                    },
                    beginAtZero: true  // Y軸を0から始める
                }
            }
        }
    });
}
