'use strict';

window.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:3000';

    const selectLang = document.querySelector('.header-swap-language'),
        header = document.querySelector('.header__wrapper'),
        basketTrigger = header.querySelector('.bascet-trigger'),
        basketShow = document.querySelector('.shop__basket-show-parent'),
        basketClose = document.querySelector('.shop__basket-back'),
        artParent = document.querySelector('.shop'),
        basketMain = document.querySelector('.shop__basket-main'),
        basketInfo = basketMain.querySelector('.shop__basket-orders'),
        basketItemContainer = document.querySelector('.shop__basket-order-items'),
        basketTotal = document.querySelector('.shop__basket-total'),
        basketTotalTable = basketTotal.querySelector('.total-table'),
        basketNoItems = document.querySelector('.bascet-zero-item'),
        basketClear = document.querySelector('.shop__basket-button');

    const basketMainDb = new Map();
    let lang = selectLang ? selectLang.value : 'en';

    if (selectLang) {
        selectLang.addEventListener('change', () => {
            lang = selectLang.value;
            swapLang(lang);
        });
    }

    BasketRender();
    getBasketItems();

    artParent.innerHTML = '';

    selectLang.addEventListener('change', () => {
        lang = selectLang.value;
        swapLang(lang);
    });

    class Art {
        constructor(id, title, artSize, paintType, paintTypeUa, year, img, priceUSD, priceUAH) {
            this.id = id;
            this.title = title;
            this.artSize = artSize;
            this.paintType = paintType;
            this.paintTypeUa = paintTypeUa;
            this.year = year;
            this.img = img;
            this.priceUSD = priceUSD;
            this.priceUAH = priceUAH;
        }

        render() {
            const item = document.createElement('div');
            item.classList.add('shop-item');

            item.innerHTML += `
                <div class="shop-item-view">
                    <img src="assets/prod/${this.img}" alt="art" class="shop-item-view-img">
                    <img src="assets/icons/shop-slider-bar.svg" alt="" class="shop-item-view-slider-bar">
                    <p class="shop-item-price en">${this.priceUSD}$</p>
                    <p class="shop-item-price uk hide" style="font-weight: 600;">${this.priceUAH} грн</p>
                </div>

                <div class="shop-item-info">
                    <p class="item-info-title">"${this.title}"</p>

                    <ul class="item-info-list">
                        <li class="item-info-list-el">${this.artSize}</li>
                        <li class="item-info-list-el en">${this.paintType}</li>
                        <li class="item-info-list-el uk hide" style="font-weight: 600;">
                            ${this.paintTypeUa}
                        </li>
                        <li class="item-info-list-el">${this.year}</li>
                    </ul>

                    <button class="btn shop-item-btn">Buy</button>
                </div>
            `;

            artParent.append(item);

            this.buyButton = item.querySelector('.shop-item-btn');

            item.addEventListener('click', (e) => {
                if (e.target === this.buyButton) {
                    addToBasket({
                        id: this.id,
                        title: this.title,
                        img: this.img,
                        priceUSD: this.priceUSD,
                        priceUAH: this.priceUAH
                    }).then(getBasketItems);
                }
            });
        }
    }

    async function addToBasket(item) {
        if (!isValidArtItem(item)) {
            console.error('Invalid item for basket:', item);
            return false;
        }

        try {
            await fetchJson(`${API_BASE}/basket`, {
                method: 'POST',
                body: JSON.stringify({
                    id: String(item.id),
                    title: item.title.trim(),
                    img: item.img.trim(),
                    priceUSD: Number(item.priceUSD),
                    priceUAH: Number(item.priceUAH)
                })
            });

            return true;
        } catch (error) {
            console.error('Failed to add item to basket:', error);
            return false;
        }
    }

    async function fetchJson(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
            return null;
        }

        return await response.json();
    }

    function isValidArtItem(item) {
        return item &&
            (typeof item.id === 'string' || typeof item.id === 'number') &&
            typeof item.title === 'string' &&
            typeof item.img === 'string' &&
            typeof item.priceUSD === 'number' &&
            typeof item.priceUAH === 'number';
    }

    async function getBasketItems() {
        try {
            const data = await fetchJson(`${API_BASE}/basket`);

            basketMainDb.clear();

            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (isValidArtItem(item)) {
                        basketMainDb.set(String(item.id), item);
                    }
                });
            }

            BasketRender();
        } catch (error) {
            console.error('Failed to load basket items:', error);
            basketMainDb.clear();
            BasketRender();
        }
    }

    async function deleteItemOfBasket(id) {
        try {
            await fetch(`${API_BASE}/basket/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            await getBasketItems();
        } catch (error) {
            console.error('Failed to delete basket item:', error);
        }
    }

    async function deleteItemOfBasketAll() {
        try {
            const items = await fetchJson(`${API_BASE}/basket`);

            if (!Array.isArray(items) || items.length === 0) {
                await getBasketItems();
                return;
            }

            await Promise.all(
                items.map(item =>
                    fetch(`${API_BASE}/basket/${encodeURIComponent(item.id)}`, {
                        method: 'DELETE'
                    })
                )
            );

            await getBasketItems();
        } catch (error) {
            console.error('Failed to clear basket:', error);
        }
    }

    const getArtCards = async (url) => {
        try {
            const data = await fetchJson(url);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Couldn't fetch art products from ${url}:`, error);
            return [];
        }
    };

    getArtCards(`${API_BASE}/artDB`)
        .then(data => {
            data.forEach(({
                id,
                title,
                artSize,
                paintType,
                paintTypeUa,
                year,
                img,
                priceUSD,
                priceUAH
            }) => {
                new Art(
                    id,
                    title,
                    artSize,
                    paintType,
                    paintTypeUa,
                    year,
                    img,
                    priceUSD,
                    priceUAH
                ).render();
            });
        });

    function BasketRender() {
        if (basketMainDb.size === 0) {
            basketNoItems.classList.remove('hide');
            basketTotal.classList.add('hide');
            basketInfo.classList.add('hide');
        } else {
            basketNoItems.classList.add('hide');
            basketTotal.classList.remove('hide');
            basketInfo.classList.remove('hide');

            basketItemContainer.innerHTML = '';
            basketTotalTable.innerHTML = '';

            let totalPriceUSD = 0;
            let totalPriceUAH = 0;

            for (const { title, img, priceUSD, priceUAH, id } of basketMainDb.values()) {
                totalPriceUSD += priceUSD;
                totalPriceUAH += priceUAH;

                const item = document.createElement('div');
                item.classList.add('order-item');

                item.innerHTML += `
                    <div class="order-item-title" data-delete="${id}">
                        <p class="order-item-title-descroption">"${title}"</p>
                        <img src="assets/icons/order-item-delete.svg"
                             alt="close-icon"
                             class="order-item-title-delete"
                             data-delete>
                    </div>

                    <img src="assets/prod/${img}" alt="art" class="order-item-view">
                `;

                const tr = document.createElement('tr');

                tr.innerHTML += `
                    <td>
                        <p class="order-item-title-descroption">"${title}" :</p>
                    </td>
                    <td>
                        <p class="order-item-price en">${priceUSD}$</p>
                        <p class="order-item-price uk hide">${priceUAH} грн.</p>
                    </td>
                `;

                basketTotalTable.append(tr);
                basketItemContainer.append(item);
            }

            basketTotalTable.innerHTML += `
                <tr>
                    <td>
                        <p class="order-title en">To pay:</p>
                        <p class="order-title uk hide">До сплати:</p>
                    </td>
                    <td>
                        <p class="order-item-price-all en">${totalPriceUSD}$</p>
                        <p class="order-item-price-all uk hide">${totalPriceUAH} грн.</p>
                    </td>
                </tr>
            `;
        }

        swapLang(lang);
    }

    header.addEventListener('click', (e) => {
        if (e.target === basketTrigger) {
            basketShow.classList.toggle('hide');
        }
    });

    basketShow.addEventListener('click', (e) => {
        if (e.target === basketClose) {
            basketShow.classList.toggle('hide');
        } else if (e.target === basketClear) {
            if (basketMainDb.size > 0) {
                const confirmThis = document.querySelector('.confirm');
                confirmThis.classList.remove('hide');

                confirmThis.addEventListener('click', (event) => {
                    if (event.target.classList.contains('conf')) {
                        confirmThis.classList.add('hide');
                        basketMainDb.clear();
                        deleteItemOfBasketAll();
                        BasketRender();
                    } else {
                        confirmThis.classList.add('hide');
                    }
                }, { once: true });
            } else {
                return;
            }
        } else if (e.target === document.querySelector('.bascet-zero-btn')) {
            basketShow.classList.toggle('hide');
        } else if (e.target.classList.contains('order-item-title-delete')) {
            let id = Number(e.target.closest('.order-item-title').dataset.delete);
            deleteItemOfBasket(id);
        }
    });

    function swapLang(currentLang) {
        const allEnItems = document.querySelectorAll('.en'),
            allUkItems = document.querySelectorAll('.uk');

        if (currentLang === 'en') {
            allEnItems.forEach(item => item.classList.remove('hide'));
            allUkItems.forEach(item => item.classList.add('hide'));
        } else if (currentLang === 'uk') {
            allUkItems.forEach(item => {
                item.classList.remove('hide');

                if (!item.classList.contains('about__description')) {
                    item.style.fontFamily = 'Montserrat';
                }
            });

            allEnItems.forEach(item => item.classList.add('hide'));
        }
    }

    const revealElements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.2 });

    revealElements.forEach(element => observer.observe(element));
});