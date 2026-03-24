class MkrLedger {
    constructor() {
        this.items = [];
        this.loadData();
        this.setDate();
    }

    setDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        document.getElementById('receipt-date').innerText = new Date().toLocaleDateString('en-US', options);
    }

    saveData() {
        localStorage.setItem('mkr_bazar_list', JSON.stringify(this.items));
    }

    loadData() {
        const saved = localStorage.getItem('mkr_bazar_list');
        if (saved) {
            this.items = JSON.parse(saved);
        }
        this.renderList();
    }

    addItem() {
        const nameInput = document.getElementById('item-name');
        const priceInput = document.getElementById('item-price');
        
        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);

        if (name && !isNaN(price) && price >= 0) {
            const newItem = { id: Date.now(), name: name, price: price };
            this.items.push(newItem);
            this.saveData();
            this.renderList();
            
            nameInput.value = '';
            priceInput.value = '';
            nameInput.focus();
        } else {
            alert("Please enter a valid item name and price.");
        }
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveData();
        this.renderList();
    }

    clearList() {
        if (confirm("Are you sure you want to clear the entire list?")) {
            this.items = [];
            this.saveData();
            this.renderList();
        }
    }

    renderList() {
        const listEl = document.getElementById('item-list');
        listEl.innerHTML = '';
        let total = 0;

        this.items.forEach(item => {
            total += item.price;
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-info">${item.name}</div>
                <div class="item-price">${item.price.toFixed(2)}</div>
                <button class="delete-btn" onclick="mkr.deleteItem(${item.id})" title="Remove item" data-html2canvas-ignore>✖</button>
            `;
            listEl.appendChild(li);
        });

        document.getElementById('grand-total').innerText = total.toFixed(2);
    }

    downloadJPG() {
        if (this.items.length === 0) { alert("List is empty!"); return; }
        const captureArea = document.getElementById('capture-area');
        const btn = document.querySelector('.bg-success');
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ Processing...";

        html2canvas(captureArea, { scale: 2, backgroundColor: '#fffdf8', useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.download = `MKR_Ledger_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            btn.innerHTML = originalText;
        }).catch(err => {
            console.error(err);
            alert("Failed to generate image.");
            btn.innerHTML = originalText;
        });
    }

    // --- Upgraded Share Logic with Mobile Fallback ---
    async shareList() {
        if (this.items.length === 0) { alert("List is empty!"); return; }

        const captureArea = document.getElementById('capture-area');
        const shareBtn = document.querySelector('.bg-primary');
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = "⏳ Preparing Image...";

        try {
            const canvas = await html2canvas(captureArea, { scale: 2, backgroundColor: '#fffdf8', useCORS: true });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            // Try to create the File object for native sharing
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `MKR_Ledger_${Date.now()}.jpg`, { type: 'image/jpeg' });

                // Check if browser allows sharing files natively
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'MKR Ledger',
                            text: 'Here is my MKR Ledger calculation.'
                        });
                    } catch (err) {
                        console.log("Native share blocked or cancelled, showing fallback modal.");
                        this.showFallbackModal(dataUrl);
                    }
                } else {
                    // Browser doesn't support file sharing, show fallback immediately
                    this.showFallbackModal(dataUrl);
                }
                shareBtn.innerHTML = originalText;
            }, 'image/jpeg', 0.95);

        } catch (err) {
            console.error("Image generation failed:", err);
            alert("Could not process the image.");
            shareBtn.innerHTML = originalText;
        }
    }

    showFallbackModal(dataUrl) {
        const modal = document.getElementById('image-modal');
        const previewImage = document.getElementById('preview-image');
        previewImage.src = dataUrl;
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('image-modal').style.display = 'none';
    }
}

// Global initialization
window.onload = () => {
    window.mkr = new MkrLedger();
};
          
