/* hyper.js - 네트워크 애니메이션 */

(() => {
    const canvas = document.getElementById("hyper-canvas");
    if (!canvas) return; // 요소가 없을 때 에러 방지
    const ctx = canvas.getContext("2d");

    const W = 1400;
    const H = 900;

    canvas.width = W;
    canvas.height = H;

    // =========================
    // LEVELS (사용자 HTML 설정 주입)
    // =========================
    const LEVELS = window.LEVELS || [];

    // =========================
    // STARS
    // =========================
    let running = true;
    let animationId = null;
    const stars = [];

    for (let i = 0; i < 500; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.5,
            a: Math.random() * Math.PI * 2,
            s: Math.random() * 0.02 + 0.002
        });
    }

    // =========================
    // MOUSE
    // =========================
    let mx = W / 2;
    let my = H / 2;

    canvas.addEventListener("mousemove", e => {
        const rect = canvas.getBoundingClientRect();
        mx = (e.clientX - rect.left) * (W / rect.width);
        my = (e.clientY - rect.top) * (H / rect.height);
    });

    // =========================
    // NODE
    // =========================
    class Node {
        constructor(levelIndex, name, x, y, color) {
            this.levelIndex = levelIndex;
            this.name = name;
            this.baseX = x;
            this.baseY = y;
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.color = color;
            this.radius = 2 + levelIndex * 0.7;
            this.offset = Math.random() * Math.PI * 2;
            this.links = [];
        }

        update(t) {
            // 자연 흔들림
            this.baseX += Math.cos(t * 0.00003 + this.offset) * 0.02;
            this.baseY += Math.sin(t * 0.00003 + this.offset) * 0.02;

            // 마우스 충돌
            const dx = this.x - mx;
            const dy = this.y - my;
            const dist = Math.hypot(dx, dy);
            const collision = 70 + this.radius * 4;

            if (dist < collision) {
                const force = (collision - dist) * 0.18;
                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }

            // 원래 위치 복귀
            this.vx += (this.baseX - this.x) * 0.004;
            this.vy += (this.baseY - this.y) * 0.004;
            this.vx *= 0.94;
            this.vy *= 0.94;
            this.x += this.vx;
            this.y += this.vy;
        }

        draw() {
            ctx.save();
            // glow
            ctx.shadowBlur = 0;
            ctx.shadowColor = this.color;
            // 검은 중심
            ctx.fillStyle = "#000000";

            // 코어 특수 디자인
            if (this.color === "render.core") {
                this.x = W / 2;
                this.y = H / 2;
                this.baseX = this.x;
                this.baseY = this.y;

                ctx.shadowBlur = 40;
                ctx.shadowColor = "#4cc9f0";

                // 흰 중심
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
                ctx.fill();

                // 무지개 도넛 링
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(performance.now() * 0.00035);

                // glow
                ctx.shadowBlur = 25;
                ctx.shadowColor = "#ffffff";

                // 무지개 gradient
                const rainbow = ctx.createConicGradient(0, 0, 0);
                rainbow.addColorStop(0.00, "#ff004c");
                rainbow.addColorStop(0.15, "#ff7b00");
                rainbow.addColorStop(0.30, "#ffe600");
                rainbow.addColorStop(0.45, "#00ff95");
                rainbow.addColorStop(0.60, "#00c3ff");
                rainbow.addColorStop(0.75, "#6a5cff");
                rainbow.addColorStop(0.90, "#ff00d4");
                rainbow.addColorStop(1.00, "#ff004c");

                // 굵은 도넛 링
                ctx.lineWidth = 8;
                ctx.strokeStyle = rainbow;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 14, 0, Math.PI * 2);
                ctx.stroke();

                // 안쪽 흰 링
                ctx.shadowBlur = 10;
                ctx.strokeStyle = "rgba(255,255,255,0.9)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();

                // 이름 표시
                ctx.font = '14px "Gowun Batang"';
                ctx.textAlign = "center";
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.fillText(this.name, this.x, this.y - this.radius - 22);
                ctx.restore();
                return;
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // glowing border
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // name
            ctx.font = '10px "Gowun Batang"';
            ctx.fillStyle = "rgba(255,255,255,0.38)";
            ctx.textAlign = "center";
            ctx.fillText(this.name, this.x, this.y - 10);
        }
    }

    // =========================
    // CREATE NODES
    // =========================
    const levels = [];
    const allNodes = [];

    for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex++) {
        const level = LEVELS[levelIndex];
        const nodes = [];

        for (let i = 0; i < level.count; i++) {
            const nodeName = level.count === 1 ? level.name : `${level.name} ${i + 1}`;
            const node = new Node(
                levelIndex,
                nodeName,
                Math.random() * W,
                Math.random() * H,
                level.color
            );
            nodes.push(node);
            allNodes.push(node);
        }

        levels.push({
            info: level,
            nodes
        });
    }

    // =========================
    // LINKS
    // =========================
    for (let i = 0; i < levels.length - 1; i++) {
        const current = levels[i].nodes;
        const upper = levels[i + 1].nodes;

        for (const node of current) {
            const connectionCount = 1 + Math.floor(Math.random() * 3);
            for (let k = 0; k < connectionCount; k++) {
                const target = upper[Math.floor(Math.random() * upper.length)];
                node.links.push(target);
            }
        }
    }

    // =========================
    // DRAW LINKS
    // =========================
    function drawLinks() {
        ctx.lineWidth = 1;
        for (const node of allNodes) {
            for (const target of node.links) {
                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.globalAlpha = 0.13;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }

    // =========================
    // DRAW MOUSE
    // =========================
    function drawMouse() {
        ctx.save();
        ctx.shadowBlur = 35;
        ctx.shadowColor = "#4cc9f0";
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // =========================
    // RENDER
    // =========================
    function render(t) {
        if (!running) return;
        animationId = requestAnimationFrame(render);

        // background
        ctx.fillStyle = "#020204";
        ctx.fillRect(0, 0, W, H);

        // nebula
        const nebula = ctx.createRadialGradient(
            W * 0.3,
            H * 0.5,
            0,
            W * 0.3,
            H * 0.5,
            700
        );
        nebula.addColorStop(0, "rgba(90,0,255,0.08)");
        nebula.addColorStop(1, "transparent");
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, W, H);

        // stars
        for (const s of stars) {
            s.a += s.s;
            const alpha = Math.sin(s.a) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // update
        for (const node of allNodes) {
            node.update(t);
        }

        // links
        drawLinks();

        // nodes
        for (const node of allNodes) {
            node.draw();
        }

        // mouse
        drawMouse();
    }

    animationId = requestAnimationFrame(render);

    // =========================
    // BUTTONS
    // =========================
    const pauseBtn = document.getElementById("pause-btn");
    const restartBtn = document.getElementById("restart-btn");

    // 완전 정지
    pauseBtn.addEventListener("click", () => {
        running = false;
        cancelAnimationFrame(animationId);
    });

    // 전체 재시작
    restartBtn.addEventListener("click", () => {
        // 기존 루프 종료
        running = false;
        cancelAnimationFrame(animationId);

        // 위치 재설정
        for (const node of allNodes) {
            node.x = Math.random() * W;
            node.y = Math.random() * H;
            node.baseX = node.x;
            node.baseY = node.y;
            node.vx = 0;
            node.vy = 0;
        }

        // 재시작
        running = true;
        render(performance.now());
    });
})();
