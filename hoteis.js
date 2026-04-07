// Configurações da API - Chave verificada na sua imagem
const API_KEY = '5eb0a5e29dmsh2311ae5c8c7e776p1ce672jsn509e07542f7'; 
const API_HOST = 'tripadvisor16.p.rapidapi.com';

// Dados de Reserva (Fallback) - Apenas se a API falhar totalmente
const HOTEIS_DEMO = [
    {
        title: "Copacabana Palace",
        primaryInfo: "Rio de Janeiro, Brasil",
        bubbleRating: { rating: 5.0, numberReviews: "12.450" },
        priceForDisplay: "R$ 2.500",
        cardPhoto: { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=60" },
        badge: "Luxo"
    },
    {
        title: "Hotel Fasano",
        primaryInfo: "Rio de Janeiro, Brasil",
        bubbleRating: { rating: 4.8, numberReviews: "8.120" },
        priceForDisplay: "R$ 3.200",
        cardPhoto: { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=60" },
        badge: "Exclusivo"
    }
];

// Função para renderizar os hotéis no HTML
function renderizarHoteis(lista, localizacao) {
    const container = document.getElementById('hotelCarousel');
    const headerTitle = document.querySelector('.section-header h3');
    
    if (headerTitle) {
        headerTitle.innerHTML = `<i class="fas fa-fire" style="color: #e74c3c;"></i> Melhores Ofertas em ${localizacao}`;
    }
    
    container.innerHTML = '';

    if (!lista || lista.length === 0) {
        lista = HOTEIS_DEMO;
    }

    lista.forEach(hotel => {
        const fotoUrl = hotel.cardPhoto?.url || 
                        hotel.primaryPhoto?.url || 
                        (hotel.images && hotel.images[0]?.url) ||
                        "https://images.unsplash.com/photo-1551882547-ff43c63faf76?auto=format&fit=crop&w=800&q=60";

        const preco = hotel.priceForDisplay || hotel.price || "Sob Consulta";
        const rating = hotel.bubbleRating?.rating || "4.5";
        const reviews = hotel.bubbleRating?.numberReviews || "Novo";

        const card = `
            <div class="hotel-card">
                <div class="card-img" style="background-image: url('${fotoUrl}')">
                    <span class="badge">${hotel.badge || "Destaque"}</span>
                </div>
                <div class="card-info">
                    <h4>${hotel.title}</h4>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${hotel.primaryInfo || localizacao}</p>
                    <div class="extra-info">
                        <span><i class="fas fa-star" style="color: #f1c40f;"></i> ${rating} (${reviews})</span>
                    </div>
                    <div class="price-section">
                        <span class="label">Preço por noite</span>
                        <span class="new-price">${preco}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-map" onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(hotel.title + ' ' + localizacao)}')">Mapa</button>
                        <button class="btn-book">Reservar</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// Função para buscar o ID da localização antes de buscar os hotéis
async function buscarHoteis(localizacao = "Rio de Janeiro") {
    const container = document.getElementById('hotelCarousel');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin"></i> Atualizando dados reais para ' + localizacao + '...</div>';

    try {
        // PASSO 1: Buscar o Location ID
        const locUrl = `https://${API_HOST}/api/v1/hotels/searchLocation?query=${encodeURIComponent(localizacao)}`;
        const locRes = await fetch(locUrl, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST }
        });
        const locData = await locRes.json();
        
        // Pega o primeiro ID encontrado
        const geoId = locData?.data?.[0]?.geoId;

        if (!geoId) {
            console.warn("ID de localização não encontrado, tentando busca direta...");
            // Fallback para busca direta se o ID falhar
            executarBuscaDireta(localizacao);
            return;
        }

        // PASSO 2: Buscar hotéis usando o geoId (Muito mais preciso para fotos e preços)
        const hotelUrl = `https://${API_HOST}/api/v1/hotels/searchHotels?geoId=${geoId}&checkIn=2026-05-10&checkOut=2026-05-15&adults=2&currency=BRL`;
        const hotelRes = await fetch(hotelUrl, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST }
        });
        const hotelData = await hotelRes.json();

        if (hotelData?.data?.data && hotelData.data.data.length > 0) {
            renderizarHoteis(hotelData.data.data, localizacao);
        } else {
            renderizarHoteis(HOTEIS_DEMO, localizacao);
        }

    } catch (error) {
        console.error("Erro na API:", error);
        renderizarHoteis(HOTEIS_DEMO, localizacao);
    }
}

// Fallback caso a busca por ID falhe
async function executarBuscaDireta(localizacao) {
    try {
        const url = `https://${API_HOST}/api/v1/hotels/searchHotels?locationName=${encodeURIComponent(localizacao)}&currency=BRL`;
        const res = await fetch(url, {
            headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST }
        });
        const data = await res.json();
        renderizarHoteis(data?.data?.data, localizacao);
    } catch (e) {
        renderizarHoteis(HOTEIS_DEMO, localizacao);
    }
}

// Listeners
document.addEventListener('DOMContentLoaded', () => {
    buscarHoteis();

    const stateFilter = document.getElementById('stateFilter');
    if (stateFilter) {
        stateFilter.addEventListener('change', (e) => buscarHoteis(e.target.value));
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = document.getElementById('searchInput').value;
            if (query) buscarHoteis(query);
        });
    }
});