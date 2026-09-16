document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    const form = document.getElementById('check-form');
    const tbody = document.getElementById('result-body');

    function drawGraph(rValue = null) { 
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Фикс размер R
        const rPx = 120; 
        const step = rPx / 4; // Шаг сетки норм тема

        ctx.clearRect(0, 0, width, height);

        ctx.beginPath();
        ctx.setLineDash([2, 4]); // пунктирная линия для сетки
        ctx.strokeStyle = '#cccccc';
        // линии от центра
        for (let i = 0; i <= width / 2; i += step) {
            ctx.moveTo(centerX + i, 0); ctx.lineTo(centerX + i, height);
            ctx.moveTo(centerX - i, 0); ctx.lineTo(centerX - i, height);
            ctx.moveTo(0, centerY + i); ctx.lineTo(width, centerY + i);
            ctx.moveTo(0, centerY - i); ctx.lineTo(width, centerY - i);
        }
        ctx.stroke();
        ctx.setLineDash([]); // Возвращаем обычную линию

        // Отрисовка областей
        ctx.fillStyle = '#3399FF';

        // 1 четверть круг 
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, rPx, 0, -Math.PI / 2, true);
        ctx.fill();

        // 4 четверть прямоугольник
        ctx.fillRect(centerX, centerY, rPx, rPx / 2);

        // 3 четверть треугольник до -R/2 даж
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - (rPx / 2), centerY);
        ctx.lineTo(centerX, centerY + (rPx / 2));
        ctx.fill();

        // осей
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        
        // X
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        // Стрелка X
        ctx.moveTo(width - 10, centerY - 5);
        ctx.lineTo(width, centerY);
        ctx.lineTo(width - 10, centerY + 5);

        // Y
        ctx.moveTo(centerX, height);
        ctx.lineTo(centerX, 0);
        // Стрелка Y
        ctx.moveTo(centerX - 5, 10);
        ctx.lineTo(centerX, 0);
        ctx.lineTo(centerX + 5, 10);
        
        ctx.stroke();

        // Добав засечек и текста 
        const tickLength = 10;
        ctx.font = '12px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // массив меток для сетки
        const fractions = [-1, -0.75, -0.5, -0.25, 0.25, 0.5, 0.75, 1];
        const labelTexts = {
            1: 'R', 0.75: '3R/4', 0.5: 'R/2', 0.25: 'R/4',
            '-1': '-R', '-0.75': '-3R/4', '-0.5': '-R/2', '-0.25': '-R/4'
        };

        fractions.forEach(frac => {
            const pos = frac * rPx;
            // либо число, либо буквенная дробь
            const text = rValue ? (rValue * frac).toString() : labelTexts[frac.toString()];

            // Засечки на оси X
            ctx.beginPath();
            ctx.moveTo(centerX + pos, centerY - tickLength / 2);
            ctx.lineTo(centerX + pos, centerY + tickLength / 2);
            ctx.stroke();
            ctx.fillText(text, centerX + pos, centerY + 15);

            // Засечки на оси Y
            ctx.beginPath();
            ctx.moveTo(centerX - tickLength / 2, centerY - pos);
            ctx.lineTo(centerX + tickLength / 2, centerY - pos);
            ctx.stroke();
            
            // Текст для оси Y
            ctx.textAlign = 'left';
            ctx.fillText(text, centerX + 10, centerY - pos);
            ctx.textAlign = 'center'; // Возвращаем для оси X
        });
        
        // Подписи осей X и Y
        ctx.font = 'bold 14px Arial';
        ctx.fillText('X', width - 15, centerY - 20);
        ctx.fillText('Y', centerX + 20, 15);
    }

    drawGraph(); // Первичная отрисовка без конкретных чисел

    // Обновление графика при выборе радиуса R
    document.querySelectorAll('input[name="r"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            drawGraph(parseFloat(e.target.value));
        });
    });

    // Валидация
    function validateFloat(value, min, max, errorElementId) {
        const errorEl = document.getElementById(errorElementId);
        const normalized = value.replace(',', '.'); 
        
        if (normalized.trim() === '') {
            errorEl.textContent = 'Поле не может быть пустым';
            return null;
        }
        
        const num = parseFloat(normalized);
        if (isNaN(num) || !isFinite(num)) {
            errorEl.textContent = 'Должно быть числом';
            return null;
        }
        
        if (num < min || num > max) {
            errorEl.textContent = `Число вне диапазона [${min} ... ${max}]`;
            return null;
        }
        
        errorEl.textContent = '';
        return num;
    }

    // Логика проверки попадания
    function checkHit(x, y, r) {
        if (x >= 0 && y >= 0) {
            return (x * x + y * y) <= (r * r); // 1 четверть круг
        } else if (x < 0 && y > 0) {
            return false; // 2 четверть (пусто, строго y > 0, чтобы ось X ушла в 3 четверть) нормтема
        } else if (x <= 0 && y <= 0) {
            return y >= -x - (r / 2); // 3 четверть треугольник, включая границу y = 0
        } else {
            return x <= r && y >= -(r / 2); // 4 четверть прямоугольник
        }
    }

    // LocalStorage
    function saveRecord(record) {
        const history = JSON.parse(localStorage.getItem('history') || '[]');
        history.push(record);
        localStorage.setItem('history', JSON.stringify(history));
        renderRow(record);
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('history') || '[]');
        history.forEach(renderRow);
    }

    function renderRow(record) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.x}</td>
            <td>${record.y}</td>
            <td>${record.r}</td>
            <td style="color: ${record.hit ? 'green' : 'red'}; font-weight: bold;">
                ${record.hit ? 'Попадание' : 'Промах'}
            </td>
            <td>${record.time}</td>
        `;
        tbody.appendChild(tr);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const x = validateFloat(document.getElementById('x-input').value, -3, 5, 'x-error');
        const y = validateFloat(document.getElementById('y-input').value, -5, 3, 'y-error');
        
        const rEl = document.querySelector('input[name="r"]:checked');
        if (!rEl) {
            document.getElementById('r-error').textContent = 'Выберите радиус R';
            return;
        }
        document.getElementById('r-error').textContent = '';
        
        if (x === null || y === null) return; 

        const r = parseFloat(rEl.value);
        const hit = checkHit(x, y, r);

        // в русской локали с учетом часового поясаа
        const formatter = new Intl.DateTimeFormat('ru-RU', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZoneName: 'short'
        });

        const record = {
            x: x.toFixed(2), 
            y: y.toFixed(2),
            r: r,
            hit: hit,
            time: formatter.format(new Date())
        };

        saveRecord(record);
    });

    loadHistory();
});
