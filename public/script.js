const base_url = 'https://sleep-diary-5uzz.onrender.com';

    // 認証状態をチェックする関数
    function checkAuthentication() {
        return fetch(`${base_url}/isauthenticated`, {
            method: 'GET',
            credentials: 'include'  // 認証情報を含める
        })
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                alert('ログインしていません。ログインしてください。');
                window.location.replace("index.html");
                return false;
            }
            return true;
        })
        .catch(error => {
            console.error('認証チェックエラー:', error);
            alert('認証の確認に失敗しました。');
            window.location.replace("index.html");
            return false;
        });
    }


    // 就寝時間と起床時間から睡眠時間を計算する関数
function calculateSleepDuration(bedTime, wakeUpTime) {
    const [bedHours, bedMinutes] = bedTime.split(':').map(Number);
    const bedTimeInMinutes = bedHours * 60 + bedMinutes;

    const [wakeHours, wakeMinutes] = wakeUpTime.split(':').map(Number);
    let wakeTimeInMinutes = wakeHours * 60 + wakeMinutes;

    // 起床時間が翌日の場合
    if (wakeTimeInMinutes < bedTimeInMinutes) {
        wakeTimeInMinutes += 24 * 60; // 24時間分を加算
    }

    // 睡眠時間を計算
    const sleepDurationInMinutes = wakeTimeInMinutes - bedTimeInMinutes;

    // 時間と分に変換
    const sleepHours = Math.floor(sleepDurationInMinutes / 60);
    const sleepMinutes = sleepDurationInMinutes % 60;

    return sleepHours + (sleepMinutes / 60); // 時間単位で返す
}

document.getElementById('dataForm').addEventListener('submit', function (event) {
    event.preventDefault(); // フォーム送信を防ぐ


    // 認証チェック
    checkAuthentication().then(isAuthenticated => {
        if (!isAuthenticated) {
            return;  // 認証されていない場合は処理を中止
        }

    const dateInput = document.getElementById('date').value; // 入力された日付
    const bed_times =document.getElementById('bed_times').value;
    const wake_up_times = document.getElementById('wake_up_times').value;
    const mood = parseFloat(document.getElementById('mood').value);  // 入力された気分スコア(数値に変換）
    const diary =document.getElementById('diary').value; //入力された日記

    //睡眠時間計算について
    let sleepDuration;
        // 就寝時間と起床時間が両方入力されている場合にのみ計算
        if (bed_times && wake_up_times) {
            sleepDuration = calculateSleepDuration(bed_times, wake_up_times);
        } else {
            // 入力が空の場合は、既存のvalue値を使用（値が空でないか確認）
            const existingValue = values[dates.indexOf(dateInput)];
            sleepDuration = existingValue || 0; // 既存の値がなければ0を使用
        }

    // 入力データのログを追加
    console.log('送信するデータ:', { date: dateInput, value: sleepDuration, mood: mood, diary:diary, bed_times:bed_times, wake_up_times: wake_up_times });

    const date = new Date(dateInput);  // 日付をDateオブジェクトに変換
    const formattedDate = date.toISOString().split('T')[0];  // 'YYYY-MM-DD'形式に変換
    console.log(formattedDate);  // 例: "2025-01-05"


    // クライアント側でデータを送信---------
    const userId = 1;  // ログイン中のユーザーID
    fetch(`${base_url}/saveOrUpdate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  // JSONデータを送信
        },
        body: JSON.stringify({ date: formattedDate, value: sleepDuration, mood: mood, diary: diary, user_id:userId, bed_times:bed_times, wake_up_times:wake_up_times })  // 送信するデータ
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('サーバーエラー');
        }
        return response.json(); // レスポンスをJSON形式で取得
    })
    .then(data => {
        console.log('保存成功:', data);

        // 保存されたデータが更新または新規の場合
        const index = dates.findIndex(d => d === formattedDate); // 同じ日付がすでに存在するか確認

        if (index !== -1) {
            // 同じ日付が存在する場合はその数値を上書き
            values[index] = sleepDuration;
            values2[index] = mood;
            diaries[index] = diary;
            bedTimes[index] =bed_times;
            wakeUpTimes[index] = wake_up_times;
        } else {
            // 新しい日付なら追加
            dates.push(formattedDate);
            values.push(sleepDuration);
            values2.push(mood);
            diaries.push(diary);
            bedTimes.push(bed_times);
            wakeUpTimes.push(wake_up_times);
        }

        // データが保存された後にグラフを更新
        // 既存のデータに新しいデータを追加
        console.log(dates, values, values2, diaries,bedTimes, wakeUpTimes); // データが正しく渡されているか確認
        drawGraph(dates, values, values2, bedTimes, wakeUpTimes);  // 新しいデータでグラフ更新
        window.location.href = '/graph.html';
    })
    .catch(error => {
        console.error('保存エラー:', error);  // エラー処理
        alert('データの保存に失敗しました');
    });
});
});

// 日付が変更されたときに該当データを取得してフォームにセット
document.getElementById('date').addEventListener('change', function () {

    // 認証チェック
    checkAuthentication().then(isAuthenticated => {
        if (!isAuthenticated) {
            return;  // 認証されていない場合は処理を中止
        }

    const dateInput = this.value; // 入力された日付
    const date = new Date(dateInput);
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD形式に変換

    console.log('選択された日付:', formattedDate);

    // サーバーから該当するデータを取得
    fetch(`${base_url}/getDataByDate?date=${formattedDate}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('データ取得エラー');
            }
            return response.json();
        })
        .then(data => {
            console.log('取得したデータ:', data);

            if (data) {
                // 取得したデータを入力欄にセット
                document.getElementById('mood').value = data.mood || '';
                document.getElementById('diary').value = data.diary || '';
                document.getElementById('bed_times').value = data.bed_times || '';
                document.getElementById('wake_up_times').value = data.wake_up_times || '';
            } else {
                // データがない場合は空欄にリセット
                document.getElementById('mood').value = '';
                document.getElementById('diary').value = '';
                document.getElementById('bed_times').value = '';
                document.getElementById('wake_up_times').value = '';
            }
        })
        .catch(error => {
            console.error('エラー:', error);
        });
});
});


// 初期のデータを保持
let dates = [];
let values = [];
let values2 = [];
let diaries = [];
let bedTimes = [];
let wakeUpTimes = [];

// ページロード時に保存されたデータを取得してグラフを描画
window.onload = function () {

    checkAuthentication().then(isAuthenticated => {
        if (!isAuthenticated) {
            return;  // 認証されていない場合、処理を中止
        }

    fetch(`${base_url}/getData`)
        .then(response => response.json())
        .then(data => {
            console.log('取得したデータ：', data); // データの確認
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
            values2 = sortedData.map(entry => entry.mood);
            diaries = sortedData.map(entry => entry.diary); // 日記データを取得
            bedTimes = sortedData.map(entry => entry.bed_times);
            wakeUpTimes = sortedData.map(entry => entry.wake_up_times);

            console.log('変換後の日付:', dates);
            console.log('変換後の値:', values);
            console.log('変換後の気分スコア:', values2);

            if (dates.length > 0) {
                drawGraph(dates, values, values2,bedTimes,wakeUpTimes); // グラフを描画
            } else {
                console.log('グラフ描画するデータがありません')
            }
        })
        .catch(error => {
            console.error('データ取得エラー:', error);
            alert('データの取得に失敗しました');
        });
    });
};

// グラフ描画関数
let chartInstance = null;

function drawGraph(dates, values, values2,bedTimes,wakeUpTimes) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    console.log('グラフの描画の準備', dates, values, values2); // データ確認

    if (!ctx) {
        console.error('キャンバスが見つかりません');
        return;
    }

    if (chartInstance) {
        chartInstance.destroy();
    }


    // 起床時間と就寝時間を分単位で変換
    const bedTimesInMinutes = bedTimes.map(time => {
        if(time && time.includes(':')){
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes; // 分単位に変換
        }
        return null;
    });

    const wakeUpTimesInMinutes = wakeUpTimes.map(time => {
        if(time && time.includes(':')){
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes; // 分単位に変換
        }
        return null;
    });


    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,  // X軸は日付
            datasets: [
                {
                    label: '睡眠時間',
                    data: values,  // Y軸は睡眠時間
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: '気分スコア',  // 2番目のデータセット（例: 気分スコア）
                    data: values2,     // Y軸のデータ（気分スコア）
                    borderColor: 'rgb(121, 255, 139)', // 線の色（気分スコア）
                    backgroundColor: 'rgba(114, 255, 119, 0.2)',  // 塗りつぶし色
                    fill: false,  // 塗りつぶし無し
                    tension: 0.1
                },
                {
                    label: '起床時間',  
                    data: wakeUpTimesInMinutes,
                    borderColor: 'rgb(251, 127, 214)', // 起床時間の線の色
                    backgroundColor: 'rgba(255, 99, 190, 0.2)', // 塗りつぶし色
                    fill: false,
                    tension: 0.1,
                    borderDash: [5, 5],  // 点線にする
                    yAxisID: 'y2'  // 別のY軸を使う設定（オプション）
                },
                {
                    label: '就寝時間',  
                    data: bedTimesInMinutes,  
                    borderColor: 'rgb(75, 118, 229)', // 就寝時間の線の色
                    backgroundColor: 'rgba(79, 60, 226, 0.2)', // 塗りつぶし色
                    fill: false,
                    tension: 0.1,
                    borderDash: [5, 5],  // 点線にする
                    yAxisID: 'y2'  // 別のY軸を使う設定（オプション）
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'yyyy-MM-dd'
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
                },
                y2: {  // 別のY軸を追加
                    position: 'right',
                    title: {
                        display: true,
                        text: '時間'
                    },
                    ticks: {
                        callback: function(value) {
                            // 分単位を「hh:mm」形式に変換して表示
                            const hours = Math.floor(value / 60);
                            const minutes = value % 60;
                            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        }
                    }
                },
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
                axis: 'xy'
            }
        }
    }
);
}

    // 範囲選択----------------------------------------
    document.getElementById('dateRangeSelector').addEventListener('change', function () {
        const selectedRange = this.value;

        const today = new Date();
        let startDate;
      
        // 範囲に応じて開始日を計算
        switch (selectedRange) {
          case '10y':
            startDate = new Date(today)
            startDate.setFullYear(today.getFullYear() - 10);  // 10年分
            break;
          case '5y':
            startDate = new Date(today)
            startDate.setFullYear(today.getFullYear() - 5);  // 5年分
            break;
          case '3y':
            startDate = new Date(today)
            startDate.setFullYear(today.getFullYear() - 3);  // 3年分
            break;
          case '1y':
            startDate = new Date(today)
            startDate.setFullYear(today.getFullYear() - 1);  // 1年分
            break;
          case '6m':
            startDate = new Date(today)
            startDate.setMonth(today.getMonth() - 6);  // 6ヶ月分
            break;
          case '3m':
            startDate = new Date(today)
            startDate.setMonth(today.getMonth() - 3);  // 3ヶ月分
            break;
          case '1m':
            startDate = new Date(today)
            startDate.setMonth(today.getMonth() - 1);  // 1ヶ月分
            break;
        case 'all':
            startDate= new Date(0);
            break;
          default:
            startDate = new Date(today)
            startDate.setMonth(today.getMonth() - 3);  // 3ヶ月分
        }
      
        // 開始日をISO形式（YYYY-MM-DD）に変換
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = new Date().toISOString().split('T')[0];  // 今日の日付
      
        console.log(`表示範囲: ${formattedStartDate} 〜 ${formattedEndDate}`);
      
        // データを取得
        fetchDataInRange2(formattedStartDate, formattedEndDate);
      });
      
      // データ取得関数
      function fetchDataInRange2(startDate, endDate) {
        fetch(`${base_url}/getDataInRange2?start=${startDate}&end=${endDate}`, {
          method: 'GET',
          credentials: 'include',
        })
          .then(response => response.json())
          .then(data => {
            console.log('取得したデータ:', data);
            updateChart(data); // グラフを更新
          })
          .catch(error => {
            console.error('エラー:', error);
            alert('データ取得エラー');
          });
      }
      

// グラフ更新関数
function updateChart(data) {
    const dates = [];
    const values = [];
    const values2 = [];
    const bedTimes = [];
    const wakeUpTimes =[];
  
    // データを整理してグラフに表示する形式に整える
    data.forEach(row => {
      const utcDate = new Date(row.date);
      const jstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000); // UTC → JST (+9時間)
      const formattedDate = jstDate.toISOString().split('T')[0];  // YYYY-MM-DD
  
      dates.push(formattedDate);
      values.push(row.value);
      values2.push(row.mood);
      bedTimes.push(row.bed_times);
      wakeUpTimes.push(row.wake_up_times);
    });

       // グラフを描画前に既存のグラフインスタンスをリセット
       if (chartInstance) {
        chartInstance.destroy();  // 既存のチャートを破棄
    }
  
    drawGraph(dates, values, values2, bedTimes, wakeUpTimes);  // グラフを更新
}

document.getElementById("logoutButton").addEventListener("click", function() {
    // ログアウトリクエストを送信
    fetch('/logout', {
      method: 'GET', // ログアウトはGETメソッドで処理
      credentials: 'same-origin' // セッション情報を送信
    })
    .then(response => {
      if (response.ok) {
        // ログアウト成功時にリダイレクト
        window.location.href = '/index.html'; // または任意のページにリダイレクト
      } else {
        // エラーハンドリング
        alert('ログアウトに失敗しました');
      }
    })
    .catch(error => {
      console.error('エラー:', error);
      alert('ネットワークエラー');
    });
  });
  