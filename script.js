
document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault(); // フォーム送信を防ぐ

    const dateInput = document.getElementById('date').value; // 入力された日付
    const value = parseFloat(document.getElementById('number').value); // 入力された数値 (数値に変換)

    const date = new Date(dateInput);  // 日付をDateオブジェクトに変換
    
    
    const formattedDate =date.toISOString().split('T')[0];  // 'YYYY-MM-DD'形式に変換
    console.log(formattedDate);  // 例: "2025-01-05"
    console.log(date.toLocaleDateString()); // ローカルタイムでの表示


    // クライアント側でデータを送信
    fetch('http://localhost:3000/saveOrUpdate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',  // JSONデータを送信
        },
        body: JSON.stringify({ date: formattedDate, value: value })  // 送信するデータ
    })
    .then(response => response.json())  // レスポンスをJSON形式で取得
    .then(data => {
        console.log('保存成功:', data);

           // 保存されたデータが更新または新規の場合
           const index = dates.findIndex(d => d === formattedDate); // 同じ日付がすでに存在するか確認

           if (index !== -1) {
            // 同じ日付が存在する場合はその数値を上書き
            values[index] = value;
        } else {
            // 新しい日付なら追加
            dates.push(formattedDate);
            values.push(value);
        }
        // データが保存された後にグラフを更新
        // 既存のデータに新しいデータを追加
        console.log(dates,values);//データが正しく渡されているか確認
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
            console.log('取得したデータ：',data); //データの確認
            // 取得したデータをグラフ用に整形
            // 日付順にソート
            const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
            console.log(sortedData);
            dates = sortedData.map(entry => {
                // 日付を日本時間に変換
                const utcDate = new Date(entry.date);
                const jstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // UTC → JST (+9時間)
                return jstDate.toISOString().split('T')[0]; // YYYY-MM-DD
            });

            values = sortedData.map(entry => entry.value);

            console.log('変換後の日付:', dates);
            console.log('変換後の値:', values);
            
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
    console.log('グラフの描画の準備',dates,values);//データ確認
  
    if(!ctx){
        console.error('キャンバスが見つかりません');
        return;
    }
    
    if(chartInstance){
        chartInstance.destroy();
    }
  
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,  // X軸は日付
            datasets: [{
                label: '睡眠時間の波',
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
                    type:'time',
                    time:{
                        unit:'day',
                        displayFormats:{
                            day:'yyyy-MM-dd'
                        }
                    },
                    title: {
                        display: true,
                        text: '日付'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '睡眠時間'
                    },
                    beginAtZero: true  // Y軸を0から始める
                }
            },
            interaction:{
                mode:'nearest',
                intersect:false,
                axis:'xy'
            }
           
        }
    });
};

