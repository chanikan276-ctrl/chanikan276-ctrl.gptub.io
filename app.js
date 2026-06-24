// Global Audio FX Reference
const sfx = window.sfx;

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initTabs();
    initRAGSimulator();
    initGameL1();
    initGameL2();
});

/* ==========================================================================
   1. NAVIGATION & SCROLLSPY
   ========================================================================== */
function initNavigation() {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 120)) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) {
                link.classList.add("active");
            }
        });
    });

    // Mobile nav close helper (if needed)
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (sfx) sfx.click();
        });
    });
}

/* ==========================================================================
   2. INTERACTIVE TABS (COFFMAN CONDITIONS)
   ========================================================================== */
function initTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (sfx) sfx.click();
            
            const targetTab = btn.getAttribute("data-tab");

            tabBtns.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(targetTab).classList.add("active");
        });
    });
}

/* ==========================================================================
   3. RESOURCE ALLOCATION GRAPH (RAG) SIMULATOR
   ========================================================================== */
function initRAGSimulator() {
    const svg = document.getElementById("rag-svg");
    const edgesGroup = document.getElementById("edges-group");
    const nodesGroup = document.getElementById("nodes-group");
    const instructionText = document.getElementById("rag-instruction");
    const analysisCard = document.getElementById("rag-analysis");

    // Tools
    const btnAddEdge = document.getElementById("btn-add-edge");
    const btnRemoveEdge = document.getElementById("btn-remove-edge");
    const btnResetGraph = document.getElementById("btn-reset-graph");
    
    // Presets
    const presetSafe = document.getElementById("preset-safe");
    const presetDeadlock = document.getElementById("preset-deadlock");
    const presetMulti = document.getElementById("preset-multi");

    // Simulator State
    let toolMode = "add"; // "add" or "remove"
    let selectedNodeId = null;
    
    // Graph Schema
    let nodes = [];
    let edges = [];

    // Node Definitions (Coordinates are fixed for neat aesthetic visual)
    const presetNodesSafeOrDeadlock = [
        { id: "P1", type: "P", name: "P1", x: 120, y: 120 },
        { id: "P2", type: "P", name: "P2", x: 480, y: 120 },
        { id: "P3", type: "P", name: "P3", x: 300, y: 340 },
        { id: "R1", type: "R", name: "Scanner (R1)", x: 300, y: 80, instances: 1 },
        { id: "R2", type: "R", name: "Printer (R2)", x: 480, y: 230, instances: 1 },
        { id: "R3", type: "R", name: "Plotter (R3)", x: 120, y: 230, instances: 1 }
    ];

    const presetNodesMulti = [
        { id: "P1", type: "P", name: "P1", x: 120, y: 120 },
        { id: "P2", type: "P", name: "P2", x: 480, y: 120 },
        { id: "P3", type: "P", name: "P3", x: 300, y: 340 },
        { id: "P4", type: "P", name: "P4", x: 300, y: 200 },
        { id: "R1", type: "R", name: "Scanner (R1)", x: 300, y: 80, instances: 2 },
        { id: "R2", type: "R", name: "Printer (R2)", x: 480, y: 230, instances: 2 },
        { id: "R3", type: "R", name: "Plotter (R3)", x: 120, y: 230, instances: 1 }
    ];

    // Presets Edges Setup
    const presetEdgesSafe = [
        { from: "R1", to: "P1" }, // R1 is allocated to P1
        { from: "P1", to: "R2" }, // P1 requests R2
        { from: "R2", to: "P2" }, // R2 allocated to P2
        { from: "P2", to: "R3" }, // P2 requests R3
        { from: "R3", to: "P3" }  // R3 allocated to P3
    ];

    const presetEdgesDeadlock = [
        { from: "R1", to: "P1" },
        { from: "P1", to: "R2" },
        { from: "R2", to: "P2" },
        { from: "P2", to: "R3" },
        { from: "R3", to: "P3" },
        { from: "P3", to: "R1" }  // Adds the cycle back to R1!
    ];

    const presetEdgesMulti = [
        { from: "R1", to: "P1" }, // Instance 1 of R1 allocated to P1
        { from: "P1", to: "R2" }, // P1 requests R2
        { from: "R2", to: "P2" }, // Instance 1 of R2 allocated to P2
        { from: "R1", to: "P3" }, // Instance 2 of R1 allocated to P3
        { from: "P3", to: "R2" }, // P3 requests R2
        { from: "R2", to: "P4" }  // Instance 2 of R2 allocated to P4
        // There is a cycle: P1 -> R2 -> P3 -> R1 -> P1.
        // However, P2 holds R2 (no requests) and P4 holds R2 (no requests), they can release them, breaking the cycle.
    ];

    // Load Preset Graph
    function loadPreset(presetName) {
        if (presetName === "safe") {
            nodes = JSON.parse(JSON.stringify(presetNodesSafeOrDeadlock));
            edges = JSON.parse(JSON.stringify(presetEdgesSafe));
            presetSafe.classList.add("active");
            presetDeadlock.classList.remove("active");
            presetMulti.classList.remove("active");
        } else if (presetName === "deadlock") {
            nodes = JSON.parse(JSON.stringify(presetNodesSafeOrDeadlock));
            edges = JSON.parse(JSON.stringify(presetEdgesDeadlock));
            presetSafe.classList.remove("active");
            presetDeadlock.classList.add("active");
            presetMulti.classList.remove("active");
        } else if (presetName === "multi") {
            nodes = JSON.parse(JSON.stringify(presetNodesMulti));
            edges = JSON.parse(JSON.stringify(presetEdgesMulti));
            presetSafe.classList.remove("active");
            presetDeadlock.classList.remove("active");
            presetMulti.classList.add("active");
        }
        selectedNodeId = null;
        updateInstruction();
        renderGraph();
    }

    // Toggle Tool Mode (Add vs Remove Edge)
    function setToolMode(mode) {
        toolMode = mode;
        selectedNodeId = null;
        if (mode === "add") {
            btnAddEdge.classList.add("active");
            btnRemoveEdge.classList.remove("active");
        } else {
            btnAddEdge.classList.remove("active");
            btnRemoveEdge.classList.add("active");
        }
        updateInstruction();
        renderGraph();
    }

    function updateInstruction() {
        if (toolMode === "add") {
            if (selectedNodeId === null) {
                instructionText.textContent = "👉 คลิกโหนดแรก (ต้นทาง) เพื่อเริ่มเชื่อมต่อเส้นความสัมพันธ์";
            } else {
                instructionText.textContent = `👉 คลิกโหนดถัดไปเพื่อต่อเส้นจาก ${selectedNodeId} (กดโหนดเดิมเพื่อยกเลิก)`;
            }
            instructionText.style.color = "var(--color-primary)";
        } else {
            instructionText.textContent = "👉 คลิกที่เส้นเชื่อมต่อสีส้มหรือสีเขียวในกราฟที่ต้องการเพื่อ 'ลบ' เส้นนั้นออก";
            instructionText.style.color = "var(--color-deadlock)";
        }
    }

    // Render nodes and edges into SVG DOM
    function renderGraph() {
        // Clear SVG
        edgesGroup.innerHTML = "";
        nodesGroup.innerHTML = "";

        // Run Banker's Safety Reduction Algorithm on the current Graph structure
        const deadlockedProcesses = detectDeadlocks(nodes, edges);
        const isDeadlocked = deadlockedProcesses.length > 0;

        // Render Edges (arrows)
        edges.forEach((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return;

            // Determine edge type: P->R is Request (orange), R->P is Hold/Assignment (green)
            const isRequest = fromNode.type === "P";
            const edgeClass = isRequest ? "svg-edge svg-edge-req" : "svg-edge svg-edge-hold";
            
            // Check if this edge is part of a deadlock cycle
            // An edge is deadlocked if both its source and target are deadlocked, or if it lies along the cycle.
            // Simplified: if the process involved in this edge is in the deadlockedProcesses array.
            const processId = fromNode.type === "P" ? fromNode.id : toNode.id;
            const isEdgeDeadlocked = isDeadlocked && deadlockedProcesses.includes(processId);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            // Draw slightly curved lines to make overlapping arrows visible if any, or just straight lines
            const x1 = fromNode.x;
            const y1 = fromNode.y;
            const x2 = toNode.x;
            const y2 = toNode.y;
            
            path.setAttribute("d", `M ${x1},${y1} L ${x2},${y2}`);
            path.setAttribute("class", isEdgeDeadlocked ? `${edgeClass} svg-edge-deadlock` : edgeClass);
            
            // Set marker arrows
            if (isEdgeDeadlocked) {
                path.setAttribute("marker-end", "url(#rag-arrow-deadlock)");
            } else {
                path.setAttribute("marker-end", isRequest ? "url(#rag-arrow-req)" : "url(#rag-arrow-hold)");
            }

            // Click listener for removing edges
            path.addEventListener("click", (e) => {
                e.stopPropagation();
                if (toolMode === "remove") {
                    if (sfx) sfx.click();
                    edges.splice(idx, 1);
                    renderGraph();
                }
            });

            edgesGroup.appendChild(path);
        });

        // Render Nodes
        nodes.forEach(node => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("transform", `translate(${node.x}, ${node.y})`);
            g.style.cursor = "pointer";

            // If selected
            const isSelected = selectedNodeId === node.id;

            if (node.type === "P") {
                // Process Node: Circle
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("r", "26");
                let pClass = "svg-node-p";
                if (isSelected) pClass += " selected";
                
                // Highlight deadlocked processes
                if (deadlockedProcesses.includes(node.id)) {
                    circle.style.fill = "var(--color-deadlock-light)";
                    circle.style.stroke = "var(--color-deadlock)";
                    circle.style.strokeWidth = "3px";
                }

                circle.setAttribute("class", pClass);
                g.appendChild(circle);

                // Text
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("dy", "5");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("class", "svg-node-text svg-node-text-p");
                text.textContent = node.name;
                g.appendChild(text);
            } else {
                // Resource Node: Rectangle
                const width = 100;
                const height = 45;
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", -width/2);
                rect.setAttribute("y", -height/2);
                rect.setAttribute("width", width);
                rect.setAttribute("height", height);
                rect.setAttribute("rx", "6");
                
                let rClass = "svg-node-r";
                if (isSelected) rClass += " selected";
                rect.setAttribute("class", rClass);
                g.appendChild(rect);

                // Instance Dots inside resource card
                const instCount = node.instances || 1;
                // Draw tiny resource instance circles inside the box
                const dotY = height/2 - 10;
                const startX = -((instCount - 1) * 12) / 2;

                // Find how many assignment edges exist for this resource
                const assignedEdges = edges.filter(e => e.from === node.id);
                
                for (let i = 0; i < instCount; i++) {
                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", startX + (i * 12));
                    dot.setAttribute("cy", dotY - 2);
                    dot.setAttribute("r", "3.5");
                    
                    // If this instance is allocated
                    if (i < assignedEdges.length) {
                        dot.setAttribute("class", "svg-node-instance allocated");
                    } else {
                        dot.setAttribute("class", "svg-node-instance");
                    }
                    g.appendChild(dot);
                }

                // Text
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("dy", "-2");
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("class", "svg-node-text svg-node-text-r");
                text.textContent = node.name.split(" ")[0]; // Just resource name, skip prefix
                g.appendChild(text);
            }

            // Click listener for node selection (making connections)
            g.addEventListener("click", () => {
                if (toolMode !== "add") return;
                if (sfx) sfx.click();

                if (selectedNodeId === null) {
                    // Select first node
                    selectedNodeId = node.id;
                    updateInstruction();
                    renderGraph();
                } else if (selectedNodeId === node.id) {
                    // Deselect
                    selectedNodeId = null;
                    updateInstruction();
                    renderGraph();
                } else {
                    // Try to add edge: selectedNodeId -> node.id
                    const fromNode = nodes.find(n => n.id === selectedNodeId);
                    const toNode = node;

                    // Validation rules
                    // 1. Process cannot connect to Process, Resource cannot connect to Resource
                    if (fromNode.type === toNode.type) {
                        instructionText.textContent = "❌ ไม่อนุญาตให้เชื่อมต่อโหนดประเภทเดียวกัน!";
                        instructionText.style.color = "var(--color-deadlock)";
                        selectedNodeId = null;
                        setTimeout(updateInstruction, 2000);
                        renderGraph();
                        return;
                    }

                    // 2. Prevent duplicate edges
                    const exists = edges.some(e => e.from === fromNode.id && e.to === toNode.id);
                    if (exists) {
                        instructionText.textContent = "❌ เส้นคู่นี้มีความสัมพันธ์อยู่แล้ว!";
                        instructionText.style.color = "var(--color-deadlock)";
                        selectedNodeId = null;
                        setTimeout(updateInstruction, 2000);
                        renderGraph();
                        return;
                    }

                    // 3. Prevent process requesting/holding the same resource at once
                    const inverseExists = edges.some(e => e.from === toNode.id && e.to === fromNode.id);
                    if (inverseExists) {
                        instructionText.textContent = "❌ กระบวนการไม่สามารถร้องขอและถือครองทรัพยากรเดียวกันพร้อมกันได้!";
                        instructionText.style.color = "var(--color-deadlock)";
                        selectedNodeId = null;
                        setTimeout(updateInstruction, 2000);
                        renderGraph();
                        return;
                    }

                    // 4. Resource Allocation limit check (Assignment R -> P)
                    if (fromNode.type === "R") {
                        const currentAllocations = edges.filter(e => e.from === fromNode.id).length;
                        if (currentAllocations >= fromNode.instances) {
                            instructionText.textContent = `❌ ทรัพยากร ${fromNode.name} เต็มจำนวนหน่วยจำลองแล้ว! (ไม่สามารถจ่ายเพิ่มได้)`;
                            instructionText.style.color = "var(--color-deadlock)";
                            selectedNodeId = null;
                            setTimeout(updateInstruction, 2000);
                            renderGraph();
                            return;
                        }
                    }

                    // Success adding edge
                    edges.push({ from: selectedNodeId, to: node.id });
                    selectedNodeId = null;
                    updateInstruction();
                    renderGraph();
                }
            });

            nodesGroup.appendChild(g);
        });

        // Update live analysis display
        updateAnalysisCard(deadlockedProcesses);
    }

    // Banker's Graph Reduction algorithm to detect Deadlocks
    function detectDeadlocks(nList, eList) {
        const processes = nList.filter(n => n.type === "P");
        const resources = nList.filter(n => n.type === "R");

        // Map data structures for Bankers safety check
        // Available resources calculation
        const avail = {};
        resources.forEach(r => {
            const allocatedCount = eList.filter(e => e.from === r.id).length;
            avail[r.id] = r.instances - allocatedCount;
        });

        // Allocation and request vectors for each process
        const allocation = {};
        const request = {};
        
        processes.forEach(p => {
            allocation[p.id] = {};
            request[p.id] = {};
            resources.forEach(r => {
                allocation[p.id][r.id] = 0;
                request[p.id][r.id] = 0;
            });
        });

        // Populate vectors from current edges list
        eList.forEach(e => {
            const fromN = nList.find(n => n.id === e.from);
            const toN = nList.find(n => n.id === e.to);
            if (!fromN || !toN) return;

            if (fromN.type === "P" && toN.type === "R") {
                // Request Edge: Process requests Resource
                request[fromN.id][toN.id] = 1;
            } else if (fromN.type === "R" && toN.type === "P") {
                // Assignment Edge: Resource allocated to Process
                allocation[toN.id][fromN.id] = 1;
            }
        });

        // Banker's Graph Reduction safety loop
        const work = { ...avail };
        const finish = {};
        processes.forEach(p => {
            // A process with 0 allocation and no request is essentially finished
            let hasAllocation = false;
            resources.forEach(r => {
                if (allocation[p.id][r.id] > 0) hasAllocation = true;
            });
            finish[p.id] = !hasAllocation; // If it holds nothing, it doesn't block anyone
        });

        let progress = true;
        while (progress) {
            progress = false;
            for (let i = 0; i < processes.length; i++) {
                const pId = processes[i].id;
                if (!finish[pId]) {
                    // Check if request <= work
                    let canProceed = true;
                    for (let j = 0; j < resources.length; j++) {
                        const rId = resources[j].id;
                        if (request[pId][rId] > work[rId]) {
                            canProceed = false;
                            break;
                        }
                    }

                    if (canProceed) {
                        // Release resources
                        for (let j = 0; j < resources.length; j++) {
                            const rId = resources[j].id;
                            work[rId] += allocation[pId][rId];
                        }
                        finish[pId] = true;
                        progress = true;
                    }
                }
            }
        }

        // Any process that cannot be finished is deadlocked
        const deadlocks = [];
        processes.forEach(p => {
            if (!finish[p.id]) {
                deadlocks.push(p.id);
            }
        });

        return deadlocks;
    }

    // Update the live text & colors on analysis card
    function updateAnalysisCard(deadlockedProcesses) {
        const statusInd = analysisCard.querySelector(".status-indicator");
        const statusText = analysisCard.querySelector(".status-text");
        const statusIcon = analysisCard.querySelector(".status-icon");
        const detailsText = analysisCard.querySelector(".analysis-details p");

        analysisCard.className = "analysis-card"; // Reset classes

        if (deadlockedProcesses.length > 0) {
            if (sfx) sfx.error();
            analysisCard.classList.add("deadlock-state");
            statusInd.className = "status-indicator deadlock";
            statusText.textContent = "สถานะปัจจุบัน: เกิด Deadlock!";
            statusIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            detailsText.innerHTML = `🚨 <strong>ตรวจพบการรอคอยเป็นวงกลม!</strong> กระบวนการ <strong>[${deadlockedProcesses.join(", ")}]</strong> ต่างกำลังติดขัดและไม่มีทางไปต่อได้ด้วยตนเอง คุณต้องปรับโครงสร้างหรือสับเปลี่ยนสิทธิ์ริบทรัพยากรบางตัวเพื่อแก้ปัญหา`;
        } else {
            analysisCard.classList.add("safe-state");
            statusInd.className = "status-indicator safe";
            statusText.textContent = "สถานะปัจจุบัน: ปลอดภัย (Safe)";
            statusIcon.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
            detailsText.innerHTML = `✅ <strong>สถานะปลอดภัย</strong> ระบบจัดสรรทรัพยากรได้อย่างลงตัว ไม่มีเงื่อนไขการรอคอยเป็นวงรอบแบบวงจรอับ ทุกโปรเซสสามารถทำจนเสร็จสิ้นได้สำเร็จ`;
        }
    }

    // Set up Tool and Button Listeners
    btnAddEdge.addEventListener("click", () => setToolMode("add"));
    btnRemoveEdge.addEventListener("click", () => setToolMode("remove"));
    btnResetGraph.addEventListener("click", () => {
        if (sfx) sfx.click();
        edges = [];
        selectedNodeId = null;
        updateInstruction();
        renderGraph();
    });

    presetSafe.addEventListener("click", () => loadPreset("safe"));
    presetDeadlock.addEventListener("click", () => loadPreset("deadlock"));
    presetMulti.addEventListener("click", () => loadPreset("multi"));

    // Initial Load
    loadPreset("safe");
}

/* ==========================================================================
   4. GAME LEVEL 1: DETECTION & RECOVERY
   ========================================================================== */
function initGameL1() {
    const optionItems = document.querySelectorAll("#game-level-1 .option-item");
    const submitBtn = document.getElementById("btn-submit-l1");
    const feedbackOverlay = document.getElementById("game-feedback-l1");
    const feedbackText = feedbackOverlay.querySelector(".feedback-text");
    const feedbackTitle = feedbackOverlay.querySelector(".feedback-title");
    const nextLvlBtn = document.getElementById("btn-next-l2");

    let selectedOption = null;

    optionItems.forEach(item => {
        item.addEventListener("click", () => {
            if (sfx) sfx.click();
            optionItems.forEach(opt => opt.classList.remove("selected"));
            item.classList.add("selected");
            selectedOption = parseInt(item.getAttribute("data-option"));
            submitBtn.removeAttribute("disabled");
        });
    });

    submitBtn.addEventListener("click", () => {
        if (!selectedOption) return;

        if (selectedOption === 3) {
            // Correct Option
            if (sfx) sfx.success();
            feedbackTitle.textContent = "🎉 ถูกต้องและมีประสิทธิภาพสูงสุด!";
            feedbackTitle.style.color = "var(--color-safe)";
            feedbackText.innerHTML = `<strong>เหตุผล:</strong> การยกเลิกโปรเซส P2 (Low Cost) เป็นทางเลือกที่ดีที่สุด เนื่องจาก:<br>
            1. P2 ถือครอง Scanner ชิ้นที่ P1 ต้องการ เมื่อหยุด P2 แล้วริบคืนทรัพยากร P1 จะทำจนจบและปล่อย Printer ชิ้นที่ P3 รอคอย<br>
            2. เป็นการเสียสละที่มีค่าทรัพยากรสูญเปล่าน้อยที่สุดในระบบ เมื่อเทียบกับการปิดทุกโปรเซส<br><br>
            <em>*แอนิเมชันกำลังดำเนินการแก้ไขและจัดคิวการทำงานใหม่ในเบื้องหลัง*</em>`;
            
            // Start animated recovery simulation
            triggerL1SuccessAnimation();
        } else {
            // Incorrect options
            if (sfx) sfx.error();
            feedbackTitle.textContent = "❌ ยังไม่ใช่วิธีที่ดีที่สุด";
            feedbackTitle.style.color = "var(--color-deadlock)";
            
            if (selectedOption === 1) {
                feedbackText.innerHTML = `<strong>ผลกระทบ:</strong> การเพิกเฉย (Ostrich Algorithm) เหมาะกับเหตุการณ์ที่เกิด deadlock น้อยมาก ๆ แต่ในขณะนี้ระบบได้ล่มลงแล้ว และผู้ใช้จะเจอปัญหาเครื่องค้างแบบไม่มีกำหนด!`;
            } else if (selectedOption === 2) {
                feedbackText.innerHTML = `<strong>ผลกระทบ:</strong> การปิดโปรเซสทั้งหมด (Abort All) แม้แก้ปัญหาได้ แต่งานทั้งหมดของโปรเซส P1 ที่ทำงานมานานใกล้เสร็จและมีต้นทุนสูง จะต้องถูกลบและทำใหม่ทั้งหมด นับว่าสิ้นเปลืองทรัพยากรสูงมาก`;
            } else {
                feedbackText.innerHTML = `<strong>ผลกระทบ:</strong> การริบทรัพยากร Printer คืนมาจาก P1 (Preemption) เหมาะเฉพาะกับโปรเซสที่มีการบันทึกสถานะชั่วคราว (Checkpointed states) เท่านั้น หากไม่มี P1 จะพังระบบโดยสมบูรณ์`;
            }
        }

        feedbackOverlay.classList.remove("hidden");
    });

    nextLvlBtn.addEventListener("click", () => {
        if (sfx) sfx.click();
        feedbackOverlay.classList.add("hidden");
        // Switch to level 2 tab
        document.getElementById("game-btn-lvl1").classList.remove("active");
        document.getElementById("game-btn-lvl2").classList.add("active");
        document.getElementById("game-level-1").classList.remove("active");
        document.getElementById("game-level-2").classList.add("active");
    });

    function triggerL1SuccessAnimation() {
        const p2 = document.getElementById("sim-p2");
        const p1 = document.getElementById("sim-p1");
        const p3 = document.getElementById("sim-p3");
        const scanner = document.getElementById("sim-r2");
        const printer = document.getElementById("sim-r1");
        const plotter = document.getElementById("sim-r3");

        // Step 1: P2 aborts (fades out)
        p2.style.transition = "opacity 0.8s";
        p2.style.opacity = "0.3";
        scanner.style.borderStyle = "solid";
        scanner.style.color = "var(--color-safe)";
        scanner.style.borderColor = "var(--color-safe)";

        // Step 2: Scanner goes to P1
        setTimeout(() => {
            p1.style.backgroundColor = "var(--color-safe-light)";
            p1.style.borderColor = "var(--color-safe)";
            p1.style.color = "var(--color-safe)";
        }, 1000);

        // Step 3: P1 finishes and releases Printer
        setTimeout(() => {
            p1.style.opacity = "0.5";
            printer.style.borderColor = "var(--color-safe)";
            printer.style.color = "var(--color-safe)";
        }, 2200);

        // Step 4: Printer goes to P3
        setTimeout(() => {
            p3.style.backgroundColor = "var(--color-safe-light)";
            p3.style.borderColor = "var(--color-safe)";
            p3.style.color = "var(--color-safe)";
        }, 3000);
    }
}

/* ==========================================================================
   5. GAME LEVEL 2: BANKER'S ALGORITHM (AVOIDANCE)
   ========================================================================== */
function initGameL2() {
    // Buttons
    const btnApprove = document.getElementById("btn-approve-req");
    const btnReject = document.getElementById("btn-reject-req");
    const btnRestart = document.getElementById("btn-restart-game");
    const gameResultOverlay = document.getElementById("game-result-l2");
    
    // Status text elements
    const availA = document.getElementById("avail-a");
    const availB = document.getElementById("avail-b");
    const availC = document.getElementById("avail-c");
    const completedCount = document.getElementById("completed-p-count");
    const systemSafety = document.getElementById("system-safety-status");
    
    // Request elements
    const reqProcessName = document.getElementById("req-process-name");
    const reqValA = document.getElementById("req-val-a");
    const reqValB = document.getElementById("req-val-b");
    const reqValC = document.getElementById("req-val-c");
    
    // Table Body
    const tableBody = document.getElementById("processes-table-body");

    // Game Variables
    let totalResources = { A: 10, B: 5, C: 7 };
    let available = { A: 5, B: 4, C: 5 };
    let processes = [
        { id: "P0", name: "P0 (คำนวณกราฟิก)", allocation: { A: 0, B: 1, C: 0 }, max: { A: 7, B: 5, C: 3 }, status: "running" },
        { id: "P1", name: "P1 (วิเคราะห์ฐานข้อมูล)", allocation: { A: 2, B: 0, C: 0 }, max: { A: 3, B: 2, C: 2 }, status: "running" },
        { id: "P2", name: "P2 (พิมพ์รายงาน)", allocation: { A: 3, B: 0, C: 2 }, max: { A: 9, B: 0, C: 2 }, status: "running" }
    ];

    // Prescripted Incoming Request Queue to teach Banker logic step-by-step
    // Format: process index, request resource vector, expected safety
    let requestQueue = [
        { procIdx: 1, req: { A: 1, B: 0, C: 2 }, isSafe: true, feedback: "อนุมัติสำเร็จ! สถานะระบบยังคงปลอดภัย มีลำดับความปลอดภัยการจบงานเป็น: P1 -> P0 -> P2" },
        { procIdx: 0, req: { A: 0, B: 3, C: 0 }, isSafe: false, feedback: "ปฏิเสธถูกต้อง! หากอนุมัติ 3 RAM ให้ P0 ทรัพยากรที่มีจะเหลือไม่เพียงพอต่อโปรเซสใดเลยที่จะจบงานได้สำเร็จ ส่งผลให้เกิด Deadlock ค้างทั้งตาราง!" },
        { procIdx: 2, req: { A: 3, B: 0, C: 0 }, isSafe: true, feedback: "อนุมัติสำเร็จ! แม้ Available CPU จะลดลงเหลือ 1 แต่ก็เพียงพอให้โปรเซสอื่น ๆ รันได้ตามลำดับปลอดภัยที่จัดเตรียมไว้" },
        { procIdx: 1, req: { A: 0, B: 2, C: 0 }, isSafe: true, isFinal: true, feedback: "เยี่ยยมมาก! P1 ได้รับทรัพยากรครบตามต้องการ สูงสุดและรันเสร็จสิ้น! ระบบรีเคลมคืนทรัพยากรของ P1 กลับสู่ศูนย์กลางทั้งหมด" }
    ];

    let currentReqIdx = 0;

    // Run Banker safety check dynamically to evaluate custom states
    function checkSafeState(testAvailable, testProcesses) {
        let work = { ...testAvailable };
        let finish = testProcesses.map(p => p.status === "finished");
        
        let safeSequence = [];
        let progress = true;

        while (progress) {
            progress = false;
            for (let i = 0; i < testProcesses.length; i++) {
                if (!finish[i]) {
                    const p = testProcesses[i];
                    // Calculate Remaining Need
                    const needA = p.max.A - p.allocation.A;
                    const needB = p.max.B - p.allocation.B;
                    const needC = p.max.C - p.allocation.C;

                    if (needA <= work.A && needB <= work.B && needC <= work.C) {
                        work.A += p.allocation.A;
                        work.B += p.allocation.B;
                        work.C += p.allocation.C;
                        finish[i] = true;
                        safeSequence.push(p.name.split(" ")[0]);
                        progress = true;
                    }
                }
            }
        }

        const allFinished = finish.every(f => f === true);
        return { isSafe: allFinished, seq: safeSequence };
    }

    function renderTable() {
        tableBody.innerHTML = "";
        processes.forEach(p => {
            const needA = p.max.A - p.allocation.A;
            const needB = p.max.B - p.allocation.B;
            const needC = p.max.C - p.allocation.C;

            let rowClass = "";
            let statusText = "รันปกติ";
            let statusBadge = "status-running";

            if (p.status === "finished") {
                rowClass = "finished";
                statusText = "เสร็จสิ้น (Reclaimed)";
                statusBadge = "status-finished";
            }

            const tr = document.createElement("tr");
            tr.className = rowClass;
            tr.innerHTML = `
                <td class="tbl-p-name">${p.name}</td>
                <td>${p.allocation.A}</td><td>${p.allocation.B}</td><td>${p.allocation.C}</td>
                <td>${p.max.A}</td><td>${p.max.B}</td><td>${p.max.C}</td>
                <td>${needA}</td><td>${needB}</td><td>${needC}</td>
                <td><span class="tbl-p-status ${statusBadge}">${statusText}</span></td>
            `;
            tableBody.appendChild(tr);
        });

        // Update dashboard values
        availA.textContent = available.A;
        availB.textContent = available.B;
        availC.textContent = available.C;

        const completed = processes.filter(p => p.status === "finished").length;
        completedCount.textContent = `${completed} / ${processes.length}`;
    }

    function renderRequest() {
        if (currentReqIdx >= requestQueue.length) {
            // Check if all processes are finished or if game cleared
            const allFinished = processes.every(p => p.status === "finished");
            if (allFinished) {
                showGameOutcome(true);
            } else {
                // If queue is done but processes remain, run them to finish as they have satisfied allocations
                runProcessesToFinish();
            }
            return;
        }

        const currentRequest = requestQueue[currentReqIdx];
        const p = processes[currentRequest.procIdx];
        
        reqProcessName.textContent = p.name;
        reqValA.textContent = currentRequest.req.A;
        reqValB.textContent = currentRequest.req.B;
        reqValC.textContent = currentRequest.req.C;
    }

    function runProcessesToFinish() {
        let progress = true;
        let delay = 0;

        // Automatically animate remaining processes finishing if they can
        while (progress) {
            progress = false;
            for (let i = 0; i < processes.length; i++) {
                const p = processes[i];
                if (p.status !== "finished") {
                    const needA = p.max.A - p.allocation.A;
                    const needB = p.max.B - p.allocation.B;
                    const needC = p.max.C - p.allocation.C;

                    if (needA <= available.A && needB <= available.B && needC <= available.C) {
                        progress = true;
                        const idx = i;
                        
                        setTimeout(() => {
                            if (sfx) sfx.success();
                            available.A += processes[idx].allocation.A;
                            available.B += processes[idx].allocation.B;
                            available.C += processes[idx].allocation.C;
                            processes[idx].allocation = { A: 0, B: 0, C: 0 };
                            processes[idx].status = "finished";
                            renderTable();
                            
                            const finishedCount = processes.filter(pr => pr.status === "finished").length;
                            if (finishedCount === processes.length) {
                                showGameOutcome(true);
                            }
                        }, delay);
                        
                        delay += 1200;
                        break;
                    }
                }
            }
        }
    }

    function showGameOutcome(isSuccess) {
        const title = document.getElementById("result-title");
        const desc = document.getElementById("result-description");
        const iconSuccess = document.getElementById("result-icon-success");
        const iconFail = document.getElementById("result-icon-fail");

        gameResultOverlay.classList.remove("hidden");

        if (isSuccess) {
            if (sfx) sfx.success();
            iconSuccess.classList.remove("hidden");
            iconFail.classList.add("hidden");
            title.textContent = "ระบบทำงานเสร็จสมบูรณ์!";
            title.style.color = "var(--color-safe)";
            desc.innerHTML = "ยินดีด้วย! คุณสามารถจัดสรรทรัพยากรด้วยตรรกะ Banker's Algorithm ปลดล๊อคโปรเซสทุกตัวโดยไม่มีสภาวะวงจรอับเกิดขึ้น คุณผ่านวิชาการจัดการทรัพยากรเรียบร้อย!";
        } else {
            if (sfx) sfx.error();
            iconSuccess.classList.add("hidden");
            iconFail.classList.remove("hidden");
            title.textContent = "ระบบล่มสลาย! (Deadlock เกิดขึ้น)";
            title.style.color = "var(--color-deadlock)";
            desc.innerHTML = "การตัดสินใจอนุมัติทำให้ระบบลื่นไถลเข้าไปสู่สถานะไม่ปลอดภัย (Unsafe State) จนในที่สุดเกิด Deadlock เครื่องค้างตลอดกาล! ลองเริ่มเกมใหม่อีกครั้งเพื่อปรับปรุงการวิเคราะห์";
        }
    }

    function resetGame() {
        available = { A: 5, B: 4, C: 5 };
        processes = [
            { id: "P0", name: "P0 (คำนวณกราฟิก)", allocation: { A: 0, B: 1, C: 0 }, max: { A: 7, B: 5, C: 3 }, status: "running" },
            { id: "P1", name: "P1 (วิเคราะห์ฐานข้อมูล)", allocation: { A: 2, B: 0, C: 0 }, max: { A: 3, B: 2, C: 2 }, status: "running" },
            { id: "P2", name: "P2 (พิมพ์รายงาน)", allocation: { A: 3, B: 0, C: 2 }, max: { A: 9, B: 0, C: 2 }, status: "running" }
        ];
        currentReqIdx = 0;
        systemSafety.className = "stat-val status-safe";
        systemSafety.innerHTML = '<i class="fa-solid fa-circle-check"></i> Safe';
        
        gameResultOverlay.classList.add("hidden");
        renderTable();
        renderRequest();
    }

    // Approve Button Click
    btnApprove.addEventListener("click", () => {
        if (sfx) sfx.click();
        const currentRequest = requestQueue[currentReqIdx];
        const targetProcess = processes[currentRequest.procIdx];

        // Perform what-if calculations
        // 1. Check request fits remaining need
        const needA = targetProcess.max.A - targetProcess.allocation.A;
        const needB = targetProcess.max.B - targetProcess.allocation.B;
        const needC = targetProcess.max.C - targetProcess.allocation.C;

        if (currentRequest.req.A > needA || currentRequest.req.B > needB || currentRequest.req.C > needC) {
            alert("โปรเซสขอเกินความต้องการสูงสุดที่แจ้งไว้!");
            return;
        }

        // 2. Check request fits Available
        if (currentRequest.req.A > available.A || currentRequest.req.B > available.B || currentRequest.req.C > available.C) {
            alert("ทรัพยากรส่วนกลางมีจำหน่ายไม่เพียงพอในตอนนี้! ต้องปฏิเสธให้รอ");
            return;
        }

        // 3. Temporarily allocate
        let tempAvail = {
            A: available.A - currentRequest.req.A,
            B: available.B - currentRequest.req.B,
            C: available.C - currentRequest.req.C
        };

        let tempProcesses = JSON.parse(JSON.stringify(processes));
        tempProcesses[currentRequest.procIdx].allocation.A += currentRequest.req.A;
        tempProcesses[currentRequest.procIdx].allocation.B += currentRequest.req.B;
        tempProcesses[currentRequest.procIdx].allocation.C += currentRequest.req.C;

        // Run Banker's Safety Algorithm
        const safetyResult = checkSafeState(tempAvail, tempProcesses);

        if (currentRequest.isSafe && safetyResult.isSafe) {
            // Player approved a safe request (Correct Action)
            available = tempAvail;
            processes[currentRequest.procIdx].allocation = tempProcesses[currentRequest.procIdx].allocation;
            
            // If request is final (it satisfies maximum need), finish process and reclaim its allocations
            if (currentRequest.isFinal) {
                available.A += processes[currentRequest.procIdx].allocation.A;
                available.B += processes[currentRequest.procIdx].allocation.B;
                available.C += processes[currentRequest.procIdx].allocation.C;
                processes[currentRequest.procIdx].allocation = { A: 0, B: 0, C: 0 };
                processes[currentRequest.procIdx].status = "finished";
            }

            if (sfx) sfx.success();
            alert(currentRequest.feedback);
            currentReqIdx++;
            renderTable();
            renderRequest();
        } else {
            // Player approved an UNSAFE request (Wrong action! Leads to deadlock)
            systemSafety.className = "stat-val status-unsafe";
            systemSafety.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Unsafe';
            
            // Apply the unsafe allocation to visually show deadlock failure
            available = tempAvail;
            processes[currentRequest.procIdx].allocation = tempProcesses[currentRequest.procIdx].allocation;
            renderTable();
            
            setTimeout(() => {
                showGameOutcome(false);
            }, 1200);
        }
    });

    // Reject / Wait Button Click
    btnReject.addEventListener("click", () => {
        if (sfx) sfx.click();
        const currentRequest = requestQueue[currentReqIdx];

        if (!currentRequest.isSafe) {
            // Player rejected an unsafe request (Correct Action!)
            if (sfx) sfx.success();
            alert(currentRequest.feedback);
            currentReqIdx++;
            renderTable();
            renderRequest();
        } else {
            // Player rejected a SAFE request (Incorrect/Inefficient Action)
            if (sfx) sfx.error();
            alert("❌ ปฏิเสธผิดจุด! คำขอนี้เป็นคำขอที่ปลอดภัย (Safe Request) การไม่อนุมัติทำให้กระบวนการทำงานช้าลงและลดประสิทธิภาพของโปรเซสเซอร์โดยไม่มีความจำเป็น");
        }
    });

    btnRestart.addEventListener("click", () => {
        if (sfx) sfx.click();
        resetGame();
    });

    // Initial table render
    resetGame();
}
