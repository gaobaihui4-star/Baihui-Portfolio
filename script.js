// Tab switching for Projects / Game Jams / Art Works
document.addEventListener("DOMContentLoaded", function () {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            const target = btn.getAttribute("data-tab");

            // Deactivate all tabs
            tabButtons.forEach(function (b) { b.classList.remove("active"); });
            tabPanels.forEach(function (p) { p.classList.remove("active"); });

            // Activate the clicked tab
            btn.classList.add("active");
            document.getElementById(target).classList.add("active");
        });
    });
});

// Images accept either .jpg or .png: when the extension written in HTML
// is missing, try the other one. Cards hide themselves if neither exists;
// the avatar falls back to a "BG" placeholder.
document.addEventListener("DOMContentLoaded", function () {
    const CANDIDATES = ["jpg", "png"];
    const AVATAR_PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
        "<rect fill='#ccc' width='100' height='100'/>" +
        "<text x='50' y='58' font-size='40' text-anchor='middle' fill='#888'>BG</text>" +
        "</svg>"
    );

    function useNextFormat(img, onGiveUp) {
        const src = img.getAttribute("src") || "";
        const match = src.match(/^(.*)\.(jpg|jpeg|png)$/i);

        // Anything without a jpg/png extension (e.g. the placeholder itself)
        // is considered final, otherwise the error handler would loop forever.
        if (!match) {
            if (src.indexOf("data:") !== 0) { onGiveUp(); }
            return;
        }

        const base = match[1];
        const tried = (img.dataset.tried || "").split(",").filter(Boolean);
        const current = match[2].toLowerCase();
        if (tried.indexOf(current) === -1) { tried.push(current); }

        const next = CANDIDATES.filter(function (ext) {
            return tried.indexOf(ext) === -1;
        })[0];

        if (!next) { onGiveUp(); return; }

        tried.push(next);
        img.dataset.tried = tried.join(",");
        img.setAttribute("src", base + "." + next);
    }

    document.querySelectorAll(".card-thumb img").forEach(function (img) {
        img.addEventListener("error", function () {
            useNextFormat(img, function () { img.style.display = "none"; });
        });
    });

    // Gallery tiles: try the other extension, show the expected filename if missing
    document.querySelectorAll(".gallery-item img").forEach(function (img) {
        // Only local files can fall back to another extension
        if ((img.getAttribute("src") || "").indexOf("./assets/") !== 0) { return; }

        function markMissing() {
            const figure = img.closest(".gallery-item");
            if (!figure) { return; }
            const name = (img.getAttribute("src") || "").replace("./assets/", "");
            figure.classList.add("is-empty");
            figure.innerHTML = "<span>" + name + "</span>";
        }

        function handleError() {
            const src = img.getAttribute("src") || "";
            // A thumbnail is missing: fall back to the full-size original
            if (src.indexOf("./assets/thumbs/") === 0) {
                const original = "./assets/" + src.split("/").pop();
                if (!img.dataset.full) { img.dataset.full = original; }
                img.setAttribute("src", original);
                return;
            }
            useNextFormat(img, markMissing);
        }

        img.addEventListener("error", handleError);

        // The image may have failed before this script ran
        if (img.complete && img.naturalWidth === 0) { handleError(); }
    });

    const avatar = document.querySelector(".avatar img");
    if (avatar) {
        avatar.addEventListener("error", function () {
            useNextFormat(avatar, function () {
                avatar.setAttribute("src", AVATAR_PLACEHOLDER);
            });
        });
    }
});

// Lightbox for the Art Works gallery: click a tile to enlarge it,
// use the arrows / keyboard / backdrop to browse and close.
document.addEventListener("DOMContentLoaded", function () {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) { return; }

    const lbImg = lightbox.querySelector("img");
    const lbCaption = lightbox.querySelector(".lightbox-caption");
    let items = [];
    let current = 0;

    function visibleImages() {
        return Array.from(document.querySelectorAll(".gallery-item img")).filter(function (img) {
            const figure = img.closest(".gallery-item");
            // Only images that are actually shown (inside the open album)
            return img.naturalWidth > 0 && img.offsetParent !== null &&
                !(figure && figure.classList.contains("is-empty"));
        });
    }

    function show(index) {
        if (!items.length) { return; }
        current = (index + items.length) % items.length;
        const img = items[current];
        // Show the full-size original in the lightbox when available
        lbImg.src = img.getAttribute("data-full") || img.getAttribute("src");
        lbImg.alt = img.alt;
        lbCaption.textContent = img.getAttribute("data-caption") || img.alt;
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
    }

    function close() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        lbImg.removeAttribute("src");
    }

    document.querySelectorAll(".gallery-item img").forEach(function (img) {
        img.addEventListener("click", function () {
            items = visibleImages();
            const index = items.indexOf(img);
            if (index === -1) { return; }
            show(index);
        });
    });

    lightbox.querySelector(".lightbox-close").addEventListener("click", close);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", function () { show(current - 1); });
    lightbox.querySelector(".lightbox-next").addEventListener("click", function () { show(current + 1); });

    lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) { close(); }
    });

    document.addEventListener("keydown", function (e) {
        if (!lightbox.classList.contains("open")) { return; }
        if (e.key === "Escape") { close(); }
        else if (e.key === "ArrowLeft") { show(current - 1); }
        else if (e.key === "ArrowRight") { show(current + 1); }
    });
});

// Art Works: open an album cover to show its image set
document.addEventListener("DOMContentLoaded", function () {
    const albumList = document.getElementById("album-list");
    if (!albumList) { return; }

    const albumViews = document.querySelectorAll(".album-view");

    function openAlbum(id) {
        albumList.classList.add("hidden");
        albumViews.forEach(function (view) {
            view.classList.toggle("active", view.id === id);
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function closeAlbum() {
        albumViews.forEach(function (view) { view.classList.remove("active"); });
        albumList.classList.remove("hidden");
    }

    document.querySelectorAll(".album").forEach(function (btn) {
        btn.addEventListener("click", function () {
            openAlbum(btn.getAttribute("data-album"));
        });
    });

    document.querySelectorAll(".album-back").forEach(function (btn) {
        btn.addEventListener("click", closeAlbum);
    });
});
