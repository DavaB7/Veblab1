document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    const form = document.getElementById('check-form');
    const tbody = document.getElementById('result-body');
    const clearBtn = document.getElementById('clear-btn'); // новинОЧКА по требованию НЕварианта 

    function drawGraph(rValue = null) { 
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Фиксируем визуальный размер R на графике 
        const rPx = 120; 
        const step = rPx / 4; 

        ctx.clearRect(0, 0, width, height);

        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = '#cccccc';
        for (let i = 0; i <= width / 2; i += step) {
            ctx.moveTo(centerX + i, 0); ctx.lineTo(centerX + i, height);
            ctx.moveTo(centerX - i, 0); ctx.lineTo(centerX - i, height);
            ctx.moveTo(0, centerY + i); ctx.lineTo(width, centerY + i);
            ctx.moveTo(0, centerY - i); ctx.lineTo(width, centerY - i);
        }
        ctx.stroke();
        ctx.setLineDash([]); 

        ctx.fillStyle = '#3399FF';

        // 1 четверть (круг R)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, rPx, 0, -Math.PI / 2, true);
        ctx.fill();

        // 4 четверть (прямоугольник: ширина R, высота R/2)
        ctx.fillRect(centerX, centerY, rPx, rPx / 2);

        // 3 четверть (треугольник до -R/2)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - (rPx / 2), centerY);
        ctx.lineTo(centerX, centerY + (rPx / 2));
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        
        // Ось X
        ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
        ctx.moveTo(width - 10, centerY - 5); ctx.lineTo(width, centerY); ctx.lineTo(width - 10, centerY + 5);

        // Ось Y
        ctx.moveTo(centerX, height); ctx.lineTo(centerX, 0);
        ctx.moveTo(centerX - 5, 10); ctx.lineTo(centerX, 0); ctx.lineTo(centerX + 5, 10);
        
        ctx.stroke();

        const tickLength = 10;
        ctx.font = '12px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fractions = [-1, -0.75, -0.5, -0.25, 0.25, 0.5, 0.75, 1];
        const labelTexts = {
            1: 'R', 0.75: '3R/4', 0.5: 'R/2', 0.25: 'R/4',
            '-1': '-R', '-0.75': '-3R/4', '-0.5': '-R/2', '-0.25': '-R/4'
        };

        fractions.forEach(frac => {
            const pos = frac * rPx;
            const text = rValue ? (rValue * frac).toString() : labelTexts[frac.toString()];

            // X засечки
            ctx.beginPath();
            ctx.moveTo(centerX + pos, centerY - tickLength / 2);
            ctx.lineTo(centerX + pos, centerY + tickLength / 2);
            ctx.stroke();
            ctx.fillText(text, centerX + pos, centerY + 15);

            // Y засечки
            ctx.beginPath();
            ctx.moveTo(centerX - tickLength / 2, centerY - pos);
            ctx.lineTo(centerX + tickLength / 2, centerY - pos);
            ctx.stroke();
            
            ctx.textAlign = 'left';
            ctx.fillText(text, centerX + 10, centerY - pos);
            ctx.textAlign = 'center'; 
        });
        
        ctx.font = 'bold 14px Arial';
        ctx.fillText('X', width - 15, centerY - 20);
        ctx.fillText('Y', centerX + 20, 15);
        
        if (rValue !== null) {
            const history = JSON.parse(localStorage.getItem('history') || '[]');
            
            history.forEach(record => {
                // Если радиус точки совпадает с текущим выбранным радиусом рисуем её ибо нефиг 
                if (parseFloat(record.r) === rValue) {
                    const xCoord = parseFloat(record.x);
                    const yCoord = parseFloat(record.y);
                    
                    // Высчитываем физические координаты пикселей на холсте
                    const px = centerX + (xCoord / rValue) * rPx;
                    const py = centerY - (yCoord / rValue) * rPx; 

                    ctx.beginPath();
                    ctx.arc(px, py, 5, 0, 2 * Math.PI); 
                    
                    // Зеленый для попадания, красный для промаха
                    ctx.fillStyle = record.hit ? '#2ecc71' : '#e74c3c'; 
                    ctx.fill();
                    
                    ctx.strokeStyle = record.hit ? '#27ae60' : '#c0392b';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        }
    }

    drawGraph(); // Рисуем первый раз при загрузке

    document.querySelectorAll('input[name="r"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            drawGraph(parseFloat(e.target.value));
        });
    });

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
        
        // Пограничные значения НЕ включительно (строго больше/меньше) фигма не проверила это нуну
        if (num <= min || num >= max) {
            errorEl.textContent = `Число вне диапазона (${min} ... ${max})`;
            return null;
        }
        
        errorEl.textContent = '';
        return num;
    }

    function checkHit(x, y, r) {
        if (x >= 0 && y >= 0) {
            return (x * x + y * y) <= (r * r); // 1 четверть
        } else if (x < 0 && y > 0) {
            return false; // 2 четверть 
        } else if (x <= 0 && y <= 0) {
            return y >= -x - (r / 2); // 3 четверть 
        } else {
            return x <= r && y >= -(r / 2); // 4 четверть 
        }
    }

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

        // Форматирование времени
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
        
        // Обновляем график, чтобы новая точка сразу появилась
        drawGraph(r); 
    });

    clearBtn.addEventListener('click', () => {
        // Удаляем историю
        localStorage.removeItem('history');
        
        // Очищаем 
        tbody.innerHTML = '';
        
        // Перерисовываем график (он нарисуется без точек, так как история пуста)
        const rEl = document.querySelector('input[name="r"]:checked');
        const currentR = rEl ? parseFloat(rEl.value) : null;
        drawGraph(currentR);
    });

    // Загружаем старую историю при обновлении страницы я устал босс дайте сдать уже
    loadHistory();
});
