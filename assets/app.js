const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
    // Boot screen
    const boot = $(".boot");
    if (boot) {
        setTimeout(() => boot.classList.add("hide"), 1250);
        boot.addEventListener("click", () => boot.classList.add("hide"));
    }

    // PC cursor
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    document.body.appendChild(cursor);

    document.addEventListener("mousemove", (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
    });

    // Mobile navigation
    const toggle = $(".menu-toggle");
    const nav = $(".main-nav");

    if (toggle) {
        toggle.onclick = () => nav.classList.toggle("open");
    }

    // Search and filters
    const search = $("#search");
    const cards = $$(".dossier");
    const filters = $$(".filter");

    function filterCards() {
        const query = (search?.value || "").toLowerCase();
        const activeFilter = $(".filter.active")?.dataset.filter || "all";

        cards.forEach((card) => {
            const matchesType =
                activeFilter === "all" || card.dataset.type === activeFilter;
            const matchesSearch = card.innerText.toLowerCase().includes(query);

            card.style.display = matchesType && matchesSearch ? "block" : "none";
        });
    }

    filters.forEach((filter) => {
        filter.onclick = () => {
            filters.forEach((item) => item.classList.remove("active"));
            filter.classList.add("active");
            filterCards();
        };
    });

    if (search) {
        search.oninput = filterCards;
    }

    // RP statistics builder
    const stats = $$("[data-stat]");
    const output = $("#discordOutput");

    function updateSheet() {
        if (!stats.length) return;

        const isDD = location.pathname.includes("fiche-dd");
        const totalStars = isDD ? 42 : 22;
        const key = isDD ? "dd" : "wd";
        let usedStars = 0;

        stats.forEach((stat) => {
            const max = Number(stat.max) || 8;
            const value = Math.max(1, Math.min(max, Number(stat.value) || 1));

            stat.value = value;
            usedStars += value;

            const preview = stat.parentElement.querySelector(".star-preview");
            const previewMax = isDD ? 8 : 9;

            if (preview) {
                preview.textContent =
                    "★".repeat(value) + "☆".repeat(Math.max(0, previewMax - value));
            }
        });

        const values = stats.map((stat) => Number(stat.value));
        const allEqual = values.every((value) => value === values[0]);
        const valid =
            usedStars === totalStars &&
            !allEqual &&
            !values.includes(0);

        const usedElement = $(`#${key}_used`);
        const progressBar = $(`#${key}_bar`);
        const validation = $(`#${key}_validation`);

        if (usedElement) {
            usedElement.textContent = `${usedStars} / ${totalStars} ★`;
        }

        if (progressBar) {
            progressBar.style.width = `${Math.min(
                100,
                (usedStars / totalStars) * 100
            )}%`;
        }

        if (validation) {
            validation.className = `validation ${valid ? "ok" : "bad"}`;

            if (valid) {
                validation.textContent =
                    "✓ Répartition valide — fiche prête à être copiée.";
            } else if (usedStars > totalStars) {
                validation.textContent = "✕ Trop d'étoiles.";
            } else if (usedStars < totalStars) {
                validation.textContent =
                    `✕ Il reste ${totalStars - usedStars} étoile(s) à répartir.`;
            } else {
                validation.textContent =
                    "✕ Toutes les catégories ne peuvent pas avoir le même score.";
            }
        }

        // Build the Discord-ready version of the sheet.
        if (output) {
            let discordText = `╭━━━━━━━━━━━━━━━━━━━━━━╮
𖥂 𝐅𝐈𝐂𝐇𝐄 — ${
                isDD ? "𝐃𝐈𝐒𝐀𝐒𝐒𝐄𝐌𝐁𝐋𝐘 𝐃𝐑𝐎𝐍𝐄" : "𝐖𝐎𝐑𝐊𝐄𝐑 𝐃𝐑𝐎𝐍𝐄"
            } 𖥂
╰━━━━━━━━━━━━━━━━━━━━━━╯

`;

            $$(".dossier-section").forEach((section) => {
                const title = section.querySelector("h2")?.textContent.trim();

                if (!title || title.includes("STATISTIQUES")) return;

                discordText += `╭─━━━━━━━ ${title} ━━━━━━━─╮\n`;

                section.querySelectorAll(".field-input").forEach((field) => {
                    const label = field.querySelector("label")?.textContent.trim() || "";
                    const input = field.querySelector("input, textarea, select");
                    const value = input?.value?.trim() || "—";

                    discordText += `✦ ${label} : ${value}\n`;
                });

                discordText += "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n";
            });

            discordText += `╭─━━━━━━━ 📊 𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐐𝐔𝐄𝐒 ━━━━━━━─╮
> ${totalStars} ÉTOILES AU TOTAL À RÉPARTIR.
`;

            stats.forEach((stat) => {
                const value = Number(stat.value);
                const max = isDD ? 8 : 9;

                discordText += `
𝐌${stat.dataset.name}
${"★".repeat(value)}${"☆".repeat(Math.max(0, max - value))}
`;
            });

            discordText += `
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯
𖥂 𝐃𝐎𝐒𝐒𝐈𝐄𝐑 𝐓𝐄𝐑𝐌𝐈𝐍𝐄́ 𖥂
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            output.textContent = discordText;
        }
    }

    stats.forEach((stat) => stat.addEventListener("input", updateSheet));
    $$('[data-copy]').forEach((input) =>
        input.addEventListener("input", updateSheet)
    );

    updateSheet();

    // Copy Discord-ready sheet
    const copyButton = $("#copySheet");
    const copyStatus = $("#copyStatus");

    if (copyButton) {
        copyButton.onclick = async () => {
            if (!$(".validation.ok")) {
                if (copyStatus) copyStatus.textContent = "✕ FICHE INVALIDE";
                return;
            }

            try {
                await navigator.clipboard.writeText(output.textContent);

                if (copyStatus) {
                    copyStatus.textContent = "✓ COPIÉ POUR DISCORD";
                    setTimeout(() => (copyStatus.textContent = ""), 2500);
                }
            } catch (error) {
                if (copyStatus) {
                    copyStatus.textContent =
                        "✕ Autorisez la copie dans le navigateur";
                }
            }
        };
    }

    // Reset form
    const resetButton = $("#resetSheet");

    if (resetButton) {
        resetButton.onclick = () => {
            $$('[data-copy]').forEach((input) => {
                if (input.tagName === "SELECT") {
                    input.selectedIndex = 0;
                } else {
                    input.value = "";
                }
            });

            stats.forEach((stat) => (stat.value = 1));
            updateSheet();
        };
    }
});
