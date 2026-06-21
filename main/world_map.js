/* world_map.js - D3.js 세계지도 및 RestCountries API 실시간 바인딩 */

(() => {
    const svg = d3.select("#world-map-svg");
    const tooltip = d3.select("#world-map-tooltip");
    const container = document.querySelector(".world-map-container");

    if (svg.empty() || tooltip.empty() || !container) {
        console.warn("World Map: Essential DOM elements are missing.");
        return;
    }

    const width = 1000;
    const height = 600;

    // 메르카토르 도법 투영 설정
    const projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 1.6]); // 아시아 및 주요 대륙이 고르게 배치되는 오프셋

    const path = d3.geoPath().projection(projection);

    // API 호출 캐싱 객체 (다시 호버했을 때 무분별한 네트워크 요청 방지)
    const apiCache = {};

    // 1. 세계지도 TopoJSON 데이터 로드
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(data => {
            // TopoJSON을 GeoJSON 피처 컬렉션으로 변환
            const countries = topojson.feature(data, data.objects.countries).features;

            // 지도 위에 국가 그리기
            svg.append("g")
                .selectAll("path")
                .data(countries)
                .join("path")
                .attr("d", path)
                .attr("class", "country")
                .on("mouseover", function(event, d) {
                    tooltip.style("display", "flex");
                    fetchCountryInfo(d.id); // D3 국가 id (ISO Numeric)로 API 트리거
                })
                .on("mousemove", function(event) {
                    // 컨테이너 상대 좌표 계산
                    const rect = container.getBoundingClientRect();
                    const x = event.clientX - rect.left + 15;
                    const y = event.clientY - rect.top + 15;

                    tooltip
                        .style("left", `${x}px`)
                        .style("top", `${y}px`);
                })
                .on("mouseout", function() {
                    tooltip.style("display", "none");
                });
        })
        .catch(err => {
            console.error("World Map: Failed to load map data.", err);
        });

    // 2. RestCountries API 동적 요청 및 툴팁 바인딩
    function fetchCountryInfo(numericId) {
        // 캐시에 있으면 즉시 활용
        if (apiCache[numericId]) {
            bindTooltipData(apiCache[numericId]);
            return;
        }

        // 로딩 중 UI 표시
        tooltip.select(".wm-tooltip-flag").text("🌐");
        tooltip.select(".wm-tooltip-country").text("조회 중...");
        tooltip.select(".wm-capital").text("-");
        tooltip.select(".wm-population").text("-");

        // Numeric 코드로 API 호출
        // RestCountries API v3.1은 numeric 코드를 alpha 엔드포인트로 조회 가능
        const code = String(numericId).padStart(3, '0');
        
        fetch(`https://restcountries.com/v3.1/alpha/${code}`)
            .then(res => {
                if (!res.ok) throw new Error("API response error");
                return res.json();
            })
            .then(data => {
                if (data && data[0]) {
                    const country = data[0];
                    const info = {
                        name: country.translations?.kor?.common || country.name?.common || "알 수 없음",
                        flag: country.flag || "🏳️",
                        capital: country.capital ? country.capital[0] : "없음",
                        population: country.population ? country.population.toLocaleString() + " 명" : "미집계"
                    };
                    
                    // 캐시에 보관
                    apiCache[numericId] = info;
                    bindTooltipData(info);
                } else {
                    throw new Error("No data found");
                }
            })
            .catch(err => {
                // 에러 핸들링 (캐시 없이 기본 안내)
                tooltip.select(".wm-tooltip-flag").text("⚠️");
                tooltip.select(".wm-tooltip-country").text("정보 없음");
                tooltip.select(".wm-capital").text("오류");
                tooltip.select(".wm-population").text("오류");
            });
    }

    // 3. 데이터를 툴팁 요소에 렌더링
    function bindTooltipData(info) {
        tooltip.select(".wm-tooltip-flag").text(info.flag);
        tooltip.select(".wm-tooltip-country").text(info.name);
        tooltip.select(".wm-capital").text(info.capital);
        tooltip.select(".wm-population").text(info.population);
    }
})();
