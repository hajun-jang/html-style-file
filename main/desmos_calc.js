/* desmos_calc.js - Desmos API 로더 및 다크모드 설정 */

(() => {
    const initCalculator = () => {
        const elt = document.getElementById("desmos-calculator");
        if (!elt) return false;

        if (typeof Desmos === "undefined") {
            return false; // API가 아직 로드되지 않음
        }

        try {
            // Desmos 그래프 계산기 인스턴스 생성 (다크모드 강제 적용)
            const calculator = Desmos.GraphingCalculator(elt, {
                keypad: true,
                expressions: true,
                settingsMenu: true,
                zoomButtons: true,
                invertedColors: true, // 다크 테마 역대비 적용
                border: false
            });

            // 기본 예제 함수 수식 입력 (사인/코사인 파형)
            calculator.setExpression({ id: 'eq1', latex: 'y=\\sin\\left(x\\right)' });
            calculator.setExpression({ id: 'eq2', latex: 'y=\\cos\\left(x\\right)' });

            console.log("Desmos Graphing Calculator successfully initialized in Dark Mode.");
            return true;
        } catch (e) {
            console.error("Desmos initialization failed:", e);
            elt.innerHTML = `<div style="color: #ff4a4a; padding: 20px; text-align: center; font-family: monospace;">DESMOS INITIALIZATION ERROR</div>`;
            return true;
        }
    };

    // 비동기 스크립트 로딩 대응을 위한 체크 루프 (100ms 주기로 최대 10초 대기)
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        const initialized = initCalculator();
        if (initialized || attempts > 100) {
            clearInterval(interval);
            if (!initialized && typeof Desmos === "undefined") {
                console.error("Desmos API failed to load in 10 seconds.");
                const elt = document.getElementById("desmos-calculator");
                if (elt) {
                    elt.innerHTML = `<div style="color: #ff4a4a; padding: 40px; text-align: center; font-family: sans-serif; line-height: 1.6;">DESMOS API LOAD FAILED<br><small style="color: rgba(255,255,255,0.4)">Please check your apiKey and network connection.</small></div>`;
                }
            }
        }
    }, 100);
})();
