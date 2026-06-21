/* desmos_calc.js - Desmos API 로더 및 다크모드 설정 */

(() => {
    const initCalculator = () => {
        const elt = document.getElementById("desmos-calculator");
        if (!elt) return false;

        if (typeof Desmos === "undefined") {
            return false; // API가 아직 로드되지 않음
        }

        try {
            // Desmos 그래프 계산기 인스턴스 생성 (수식 입력창 비활성화 및 색반전 해제)
            const calculator = Desmos.GraphingCalculator(elt, {
                keypad: false,         // 키패드 숨김
                expressions: false,    // 좌측 수식 입력창 숨김
                settingsMenu: true,
                zoomButtons: true,
                invertedColors: false, // 색상 반전 해제
                border: false
            });

            // 사용자 지정 수식 목록 가져오기 (window.DESMOS_EXPRESSIONS)
            const expressions = window.DESMOS_EXPRESSIONS || [];
            expressions.forEach(expr => {
                calculator.setExpression(expr);
            });

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
