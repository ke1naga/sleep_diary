// script.js
document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault(); // フォームの送信を防ぐ

    // 入力されたデータを取得
    const input = document.getElementById('dataInput').value;
    const dataArray = input.split(',').map(num => parseFloat(num.trim()));

    // 入力データが正しいか確認
    if (dataArray.some(isNaN)) {
        alert('数値のみをカンマ区切りで入力してください');
        return;
    }

    // グラフを描画
    const ctx = document.getElementById('lineChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataArray.map((_, index) => `Point ${index + 1}`), // X軸ラベル
            datasets: [{
                label: '入力された数値',
                data: dataArray, // Y軸データ
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
                        text: 'データポイント'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '数値'
                    }
                }
            }
        }
    });
});
