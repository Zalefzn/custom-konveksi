//Navbar Scrolled

window.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

//Navbar Active

const currentPage = window.location.pathname.split("/").pop();
const menuLinks = document.querySelectorAll(".menu a");

menuLinks.forEach((link) => {
  const linkPage = link.getAttribute("href").split("/").pop();

  if (
    linkPage === currentPage ||
    (linkPage === "" && currentPage === "index.html")
  ) {
    link.classList.add("active");
  } else {
    link.classList.remove("active");
  }
});

//Order Wizard

const steps = document.querySelectorAll(".wizard-step");
const forms = document.querySelectorAll(".wizard-form");
let current = 0;

function showStep(index) {
  forms.forEach((f, i) => {
    f.classList.toggle("active", i === index);
    steps[i].classList.toggle("active", i <= index);
  });
}

document.querySelectorAll(".wizard-next-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (current < forms.length - 1) {
      current++;
      showStep(current);
    }
  });
});

document.querySelectorAll(".wizard-prev-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (current > 0) {
      current--;
      showStep(current);
    }
  });
});

document.querySelector(".wizard-finish-btn")?.addEventListener("click", () => {
  alert("Order berhasil dikirim! 🚀");
});

showStep(current);

//Card Step 1

const productOptions = document.querySelectorAll(
  "#product-options .product-option"
);
const modelWrapper = document.getElementById("model-wrapper");
const modelOptions = document.getElementById("model-options");
const modelTitle = document.getElementById("model-selection-title");

const models = {
  Kaos: ["Kaos Pendek", "Kaos Lengan Panjang", "Kaos Reglan", "Kaos Oversize"],
  Jaket: ["Bomber", "Jaket Hoodie", "Windbreaker", "Sweater"],
  Topi: ["Snapback", "Trucker", "Bucket Hat", "Topi Polos"],
  Jersey: ["Jersey Bola", "Jersey Basket", "Jersey eSports", "Jersey Custom"],
};

productOptions.forEach((option) => {
  option.addEventListener("click", () => {
    productOptions.forEach((o) => o.classList.remove("selected"));
    option.classList.add("selected");

    const selectedProduct = option.dataset.product;
    modelTitle.innerText = `Pilih Model ${selectedProduct}`;
    modelOptions.innerHTML = "";

    models[selectedProduct].forEach((model) => {
      const modelCard = document.createElement("div");
      modelCard.className = "product-option";
      modelCard.innerHTML = `
        <span class="option-indicator"></span>
        <div class="option-label">${model}</div>`;
      modelOptions.appendChild(modelCard);

      modelCard.addEventListener("click", () => {
        modelOptions
          .querySelectorAll(".product-option")
          .forEach((m) => m.classList.remove("selected"));
        modelCard.classList.add("selected");
      });
    });

    modelWrapper.classList.remove("hidden");
  });
});



//Step Card 2

const canvas = document.getElementById("shirtCanvas");
const ctx = canvas.getContext("2d");
const shirtImg = new Image();
shirtImg.src = "/assets/kaos.png";

let currentColor = "#ffffff";
let designs = [];
let activeDesignIndex = null;
let isDragging = false;
let isResizing = false;
let resizeHandleSize = 15;
let offsetX = 0;
let offsetY = 0;

shirtImg.onload = () => {
  drawShirt(currentColor);
};

function drawShirt(color) {
  currentColor = color;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(shirtImg, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(shirtImg, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  designs.forEach((d, index) => {
    ctx.drawImage(d.img, d.x, d.y, d.w, d.h);
    if (index === activeDesignIndex) {
      ctx.fillStyle = "rgba(255,0,0,0.9)";
      ctx.fillRect(d.x + d.w - resizeHandleSize, d.y + d.h - resizeHandleSize, resizeHandleSize, resizeHandleSize);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    }
  });
}

document.querySelectorAll(".color-option").forEach((opt) => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".color-option").forEach((o) => o.classList.remove("active"));
    opt.classList.add("active");
    const color = opt.getAttribute("data-color");
    drawShirt(color);
  });
});

const designOptions = document.querySelectorAll("#designTypeOptions .design-type-card");
const designFormContainer = document.getElementById("designFormContainer");

designOptions.forEach((option) => {
  option.addEventListener("click", () => {
    designOptions.forEach((o) => o.classList.remove("selected"));
    option.classList.add("selected");
    const type = option.getAttribute("data-type");
    designFormContainer.innerHTML = "";
    if (type === "full") {
      designFormContainer.innerHTML = `
        <div class="form-group">
          <label class="section-label">Upload File Desain</label>
          <div class="upload-box" style="border: 2px dashed #ccc; padding: 10px; cursor: pointer;">
            Pilih File Design (JPG, PNG) - Bisa Multiple
          </div>
          <input type="file" accept=".jpg,.jpeg,.png" multiple style="display:none;" />
        </div>`;
      const uploadBox = designFormContainer.querySelector(".upload-box");
      const fileInput = designFormContainer.querySelector('input[type="file"]');
      uploadBox.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = function(ev) {
            const img = new Image();
            img.onload = () => {
              const w = canvas.width * 0.3;
              const h = img.height * (w / img.width);
              const x = (canvas.width - w) / 2 + (Math.random() - 0.5) * 40;
              const y = (canvas.height - h) / 2 + (Math.random() - 0.5) * 40;
              designs.push({ img, x, y, w, h });
              activeDesignIndex = designs.length - 1;
              drawShirt(currentColor);
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      });
    } else if (type === "galeri") {
      designFormContainer.innerHTML = `
        <label class="section-label">Pilih dari Galeri Desain</label>
        <div class="design-type-options">
          <div class="design-type-card">Desain 1</div>
          <div class="design-type-card">Desain 2</div>
          <div class="design-type-card">Desain 3</div>
          <div class="design-type-card">Desain 4</div>
        </div>`;
    } else if (type === "jasa") {
      document.querySelector(".wizard-next-btn").click();
    }
  });
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  activeDesignIndex = null;
  for (let i = designs.length - 1; i >= 0; i--) {
    const d = designs[i];
    if (mouseX >= d.x + d.w - resizeHandleSize && mouseX <= d.x + d.w && mouseY >= d.y + d.h - resizeHandleSize && mouseY <= d.y + d.h) {
      activeDesignIndex = i;
      isResizing = true;
      isDragging = false;
      return;
    }
    if (mouseX >= d.x && mouseX <= d.x + d.w && mouseY >= d.y && mouseY <= d.y + d.h) {
      activeDesignIndex = i;
      isDragging = true;
      isResizing = false;
      offsetX = mouseX - d.x;
      offsetY = mouseY - d.y;
      return;
    }
  }
  drawShirt(currentColor);
});

canvas.addEventListener("mousemove", (e) => {
  if (activeDesignIndex === null) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const d = designs[activeDesignIndex];
  if (!d) return;
  if (isDragging) {
    d.x = mouseX - offsetX;
    d.y = mouseY - offsetY;
    if (d.x < 0) d.x = 0;
    if (d.y < 0) d.y = 0;
    if (d.x + d.w > canvas.width) d.x = canvas.width - d.w;
    if (d.y + d.h > canvas.height) d.y = canvas.height - d.h;
    drawShirt(currentColor);
  } else if (isResizing) {
    d.w = Math.max(20, mouseX - d.x);
    d.h = Math.max(20, mouseY - d.y);
    if (d.x + d.w > canvas.width) d.w = canvas.width - d.x;
    if (d.y + d.h > canvas.height) d.h = canvas.height - d.y;
    drawShirt(currentColor);
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
  isResizing = false;
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  let found = false;
  for (let i = designs.length - 1; i >= 0; i--) {
    const d = designs[i];
    if (mouseX >= d.x && mouseX <= d.x + d.w && mouseY >= d.y && mouseY <= d.y + d.h) {
      activeDesignIndex = i;
      found = true;
      break;
    }
  }
  if (!found) activeDesignIndex = null;
  drawShirt(currentColor);
});

document.addEventListener("keydown", (e) => {
  if ((e.key === "Delete" || e.key === "Backspace") && activeDesignIndex !== null) {
    designs.splice(activeDesignIndex, 1);
    activeDesignIndex = null;
    drawShirt(currentColor);
  }
});

document.getElementById("downloadDesignBtn").addEventListener("click", () => {
  const canvas = document.getElementById("shirtCanvas");
  const link = document.createElement("a");
  link.download = "desain-kaos.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});



