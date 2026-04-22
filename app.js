// API 1: Anime Quotes (AnimeChan) - bez zmian, działa dobrze
const quoteText = document.getElementById('animechanFact');
const quoteSource = document.getElementById('animechanSource');
const refreshQuoteBtn = document.getElementById('refreshAnimechan');

async function fetchAnimeQuote() {
    if (!quoteText) return;
    
    quoteText.textContent = 'Ładowanie cytatu...';
    quoteText.style.opacity = '0.5';
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // krótszy timeout
        
        const response = await fetch('/api/proxy/quote', { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.quote) {
            quoteText.textContent = `"${data.quote}" — ${data.character} (${data.anime})`;
            quoteSource.innerHTML = '<i class="fa-solid fa-code-branch"></i> Źródło: AnimeChan API ✅';
        } else {
            throw new Error('Błędny format');
        }
        quoteText.style.opacity = '1';
        
    } catch (error) {
        console.warn('AnimeChan błąd:', error.message);
        // Fallback - cytaty lokalne
        const fallbackQuotes = [
            { quote: "Those who break the rules are scum, but those who abandon their friends are worse than scum.", character: "Kakashi Hatake", anime: "Naruto" },
            { quote: "Believe in yourself and create your own destiny.", character: "Naruto Uzumaki", anime: "Naruto" },
            { quote: "The only way to truly escape the mundane is to constantly be evolving.", character: "Kaneki Ken", anime: "Tokyo Ghoul" },
            { quote: "Power comes in response to a need, not a desire.", character: "Goku", anime: "Dragon Ball Z" },
            { quote: "Knowing what you can't do is more important than knowing what you can.", character: "Lelouch", anime: "Code Geass" }
        ];
        const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        quoteText.textContent = `"${random.quote}" — ${random.character} (${random.anime})`;
        quoteSource.innerHTML = '<i class="fa-solid fa-database"></i> Źródło: Offline (API niedostępne) ⚠️';
        quoteText.style.opacity = '1';
    }
}

// =============== API 2 i 3 - Z OBSŁUGĄ RATE LIMIT ===============
let lastJikanCall = 0;
const JIKAN_MIN_INTERVAL = 1000; // minimum 1s między zapytaniami

async function callJikanAPI(endpoint) {
    const now = Date.now();
    const timeSinceLastCall = now - lastJikanCall;
    
    if (timeSinceLastCall < JIKAN_MIN_INTERVAL) {
        const waitTime = JIKAN_MIN_INTERVAL - timeSinceLastCall;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastJikanCall = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    
    try {
        const response = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.status === 429) {
            throw new Error('RATE_LIMIT');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// API 2: Anime Facts
const factText = document.getElementById('animefactsFact');
const factSource = document.getElementById('animefactsSource');
const refreshFactBtn = document.getElementById('refreshAnimefacts');

const animeFactsList = [
    "Najdłuższa seria anime to 'Sazae-san' z ponad 7500 odcinkami!",
    "'Spirited Away' było pierwszym anime, które zdobyło Oscara.",
    "'One Piece' sprzedał się w ponad 500 milionach kopii na świecie.",
    "Pierwsze anime powstało w 1917 roku - 'Namakura Gatana'.",
    "Hayao Miyazaki osobiście sprawdza każdą klatkę filmów Ghibli.",
    "'Dragon Ball Z' spopularyzował anime na Zachodzie w latach 90.",
    "Głos Pikachu (Ikue Otani) użycza go od ponad 20 lat.",
    "'Neon Genesis Evangelion' uratowało przemysł anime w Japonii.",
    "'Your Name' Makoto Shinkai jest najlepiej zarabiającym anime.",
    "'Attack on Titan' zostało zainspirowane pracą autora jako bramkarz."
];

async function fetchAnimeFact() {
    if (!factText) return;
    
    factText.textContent = 'Ładowanie faktu...';
    factText.style.opacity = '0.5';
    
    try {
        const data = await callJikanAPI('/api/proxy/anime');
        const anime = data.data;
        
        const fact = `${anime.title} ma ${anime.episodes || 'nieznaną'} liczbę odcinków, ocenę ${anime.score || 'N/A'}/10 na MyAnimeList.`;
        factText.textContent = fact;
        factSource.innerHTML = `<i class="fa-solid fa-code-branch"></i> Źródło: Jikan API | ${anime.title} ✅`;
        factText.style.opacity = '1';
        
    } catch (error) {
        console.warn('Jikan API błąd:', error.message);
        
        const randomIndex = Math.floor(Math.random() * animeFactsList.length);
        factText.textContent = animeFactsList[randomIndex];
        factSource.innerHTML = '<i class="fa-solid fa-database"></i> Źródło: Lokalna baza faktów (limit API) ⚠️';
        factText.style.opacity = '1';
    }
}

// API 3: Random Anime Info
const animeInfoText = document.getElementById('jikanFact');
const animeInfoSource = document.getElementById('jikanSource');
const refreshAnimeBtn = document.getElementById('refreshJikan');

const fallbackAnime = [
    { title: "Attack on Titan", year: 2013, score: 9.0, episodes: 87, desc: "Ludzie żyją za ogromnymi murami chroniącymi ich przed Tytanami." },
    { title: "Fullmetal Alchemist: Brotherhood", year: 2009, score: 9.1, episodes: 64, desc: "Dwaj bracia używają alchemii, by przywrócić swoje ciała." },
    { title: "Death Note", year: 2006, score: 8.6, episodes: 37, desc: "Genialny uczeń znajduje notes, który może zabić każdego." },
    { title: "One Punch Man", year: 2015, score: 8.7, episodes: 24, desc: "Bohater, który pokonuje każdego jednym ciosem." },
    { title: "Demon Slayer", year: 2019, score: 8.8, episodes: 55, desc: "Chłopiec zostaje pogromcą demonów, by ocalić siostrę." }
];

async function fetchRandomAnime() {
    if (!animeInfoText) return;
    
    animeInfoText.textContent = 'Ładowanie informacji...';
    animeInfoText.style.opacity = '0.5';
    
    try {
        const data = await callJikanAPI('/api/proxy/anime');
        const anime = data.data;
        
        const synopsis = anime.synopsis ? anime.synopsis.substring(0, 200) + '...' : 'Brak opisu';
        animeInfoText.innerHTML = `<strong>📺 ${escapeHtml(anime.title)}</strong><br><br>📅 Rok: ${anime.year || 'Nieznany'} | ⭐ Ocena: ${anime.score || 'N/A'}/10 | 📺 Odcinki: ${anime.episodes || 'Nieznane'}<br><br>${escapeHtml(synopsis)}`;
        animeInfoSource.innerHTML = `<i class="fa-solid fa-code-branch"></i> Źródło: Jikan API (MyAnimeList) ✅`;
        animeInfoText.style.opacity = '1';
        
    } catch (error) {
        console.warn('Jikan API błąd:', error.message);
        
        const random = fallbackAnime[Math.floor(Math.random() * fallbackAnime.length)];
        animeInfoText.innerHTML = `<strong>📺 ${random.title}</strong><br><br>📅 Rok: ${random.year} | ⭐ Ocena: ${random.score}/10 | 📺 Odcinki: ${random.episodes}<br><br>${random.desc}`;
        animeInfoSource.innerHTML = '<i class="fa-solid fa-database"></i> Źródło: Lokalna baza (limit API) ⚠️';
        animeInfoText.style.opacity = '1';
    }
}

// =============== KOLEJKOWANE ŁADOWANIE PRZY STARCIE ===============
document.addEventListener('DOMContentLoaded', async () => {
    // Ładuj API jedno po drugim z opóźnieniem
    await fetchAnimeQuote();
    await new Promise(r => setTimeout(r, 800)); // 0.8s przerwy
    await fetchAnimeFact();
    await new Promise(r => setTimeout(r, 800));
    await fetchRandomAnime();
});
