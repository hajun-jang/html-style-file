/* world_map.js - D3.js 세계지도 및 CDN 데이터 바인딩 */

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

    // 국가 메타데이터 저장 객체
    let countriesData = null;

    // 1. 세계지도 TopoJSON 데이터와 국가 메타데이터 병렬 로드
    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
        d3.json("https://cdn.jsdelivr.net/gh/dr5hn/countries-states-cities-database@master/json/countries.json")
    ]).then(([mapData, metaData]) => {
        countriesData = metaData;

        // TopoJSON을 GeoJSON 피처 컬렉션으로 변환
        const countries = topojson.feature(mapData, mapData.objects.countries).features;

        // 지도 위에 국가 그리기
        svg.append("g")
            .selectAll("path")
            .data(countries)
            .join("path")
            .attr("d", path)
            .attr("class", "country")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "flex");
                showCountryInfo(d.id); // D3 국가 id (ISO Numeric)로 로컬 메타데이터 조회
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
    }).catch(err => {
        console.error("World Map: Failed to load map or country data.", err);
    });

    // 2. 국가 메타데이터 매칭 및 바인딩
    function showCountryInfo(numericId) {
        if (!countriesData) return;

        // D3의 numericId는 숫자형이므로, c.numeric_code (3자리 문자열)와 매칭
        const country = countriesData.find(c => parseInt(c.numeric_code) === numericId);

        if (country) {
            const info = {
                name: country.translations?.ko || country.name || "알 수 없음",
                flag: country.emoji || "🏳️",
                capital: country.capital || "없음",
                population: country.population ? country.population.toLocaleString() + " 명" : "미집계"
            };
            bindTooltipData(info);
        } else {
            // 해당 ID의 국가 데이터가 없을 경우 기본 표시
            tooltip.select(".wm-tooltip-flag").text("🌐");
            tooltip.select(".wm-tooltip-country").text("정보 없음");
            tooltip.select(".wm-capital").text("-");
            tooltip.select(".wm-population").text("-");
        }
    }

    // 3. 데이터를 툴팁 요소에 렌더링
    function bindTooltipData(info) {
        tooltip.select(".wm-tooltip-flag").text(info.flag);
        tooltip.select(".wm-tooltip-country").text(info.name);
        tooltip.select(".wm-capital").text(info.capital);
        tooltip.select(".wm-population").text(info.population);
    }
})();
