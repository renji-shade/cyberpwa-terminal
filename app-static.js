// =============== FORM VALIDATOR (Client-side only) ===============
const registerForm = document.getElementById('registerForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');

const usernameError = document.getElementById('usernameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const registerResult = document.getElementById('registerResult');

// Load/save users from localStorage instead of backend
let users = JSON.parse(localStorage.getItem('users') || '[]');
let nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function validateUsername(username) {
    if (username.length < 3) {
        return { valid: false, message: 'Username must be at least 3 characters' };
    }
    return { valid: true, message: '' };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true, message: '' };
}

function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasLetter) {
        return { valid: false, message: 'Password must contain at least one letter' };
    }
    if (!hasDigit) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecial) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }
    
    return { valid: true, message: '' };
}

function validatePasswordMatch(password, confirm) {
    if (password !== confirm) {
        return { valid: false, message: 'Passwords do not match' };
    }
    return { valid: true, message: '' };
}

function showError(element, message) {
    element.textContent = message;
}

function clearError(element) {
    element.textContent = '';
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    
    let isValid = true;
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        showError(usernameError, usernameValidation.message);
        isValid = false;
    } else {
        clearError(usernameError);
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showError(emailError, emailValidation.message);
        isValid = false;
    } else {
        clearError(emailError);
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showError(passwordError, passwordValidation.message);
        isValid = false;
    } else {
        clearError(passwordError);
    }
    
    const matchValidation = validatePasswordMatch(password, confirm);
    if (!matchValidation.valid) {
        showError(confirmError, matchValidation.message);
        isValid = false;
    } else {
        clearError(confirmError);
    }
    
    if (isValid) {
        // Check if user already exists
        if (users.some(u => u.email === email)) {
            registerResult.className = 'register-result error';
            registerResult.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> User with this email already exists';
        } else if (users.some(u => u.username === username)) {
            registerResult.className = 'register-result error';
            registerResult.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> User with this username already exists';
        } else {
            const newUser = {
                id: nextId++,
                username,
                email,
                password
            };
            users.push(newUser);
            saveUsers();
            
            registerResult.className = 'register-result success';
            registerResult.innerHTML = '<i class="fa-solid fa-check-circle"></i> User registered successfully';
            registerForm.reset();
            
            const usersListDiv = document.getElementById('usersList');
            if (usersListDiv && usersListDiv.innerHTML !== '<p class="info-text">No data. Click button to load.</p>') {
                loadUsers();
            }
        }
        
        setTimeout(() => {
            registerResult.className = 'register-result';
            registerResult.innerHTML = '';
        }, 3000);
    }
});

// =============== API 1: Anime Quotes (Direct fetch with CORS) ===============
const quoteText = document.getElementById('animechanFact');
const quoteSource = document.getElementById('animechanSource');
const refreshQuoteBtn = document.getElementById('refreshAnimechan');

async function fetchAnimeQuote() {
    if (!quoteText) return;
    
    quoteText.textContent = 'Loading quote...';
    quoteText.style.opacity = '0.5';
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        // Direct fetch - AnimeChan supports CORS
        const response = await fetch('https://animechan.xyz/api/random', { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        
        const data = await response.json();
        
        if (data && data.quote && data.character && data.anime) {
            quoteText.textContent = '"' + data.quote + '" — ' + data.character + ' (' + data.anime + ')';
            quoteSource.innerHTML = '<i class="fa-solid fa-code-branch"></i> Source: AnimeChan API | Status: ONLINE';
        } else {
            throw new Error('Invalid data format');
        }
        quoteText.style.opacity = '1';
        
    } catch (error) {
        console.error('API error, using fallback:', error);
        
        const fallbackQuotes = [
            { quote: "Those who break the rules are scum, but those who abandon their friends are worse than scum.", character: "Kakashi Hatake", anime: "Naruto" },
            { quote: "Believe in yourself and create your own destiny. Don't let fear control you.", character: "Naruto Uzumaki", anime: "Naruto" },
            { quote: "The only way to truly escape the mundane is to constantly be evolving.", character: "Kaneki Ken", anime: "Tokyo Ghoul" },
            { quote: "If you don't like your destiny, don't accept it. Instead, have the courage to change it.", character: "Yato", anime: "Noragami" },
            { quote: "Power comes in response to a need, not a desire.", character: "Goku", anime: "Dragon Ball Z" },
            { quote: "Knowing what you can't do is more important than knowing what you can.", character: "Lelouch Lamperouge", anime: "Code Geass" }
        ];
        const random = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        quoteText.textContent = '"' + random.quote + '" — ' + random.character + ' (' + random.anime + ')';
        quoteSource.innerHTML = '<i class="fa-solid fa-database"></i> Source: Offline Database | Status: FALLBACK';
        quoteText.style.opacity = '1';
    }
}

if (refreshQuoteBtn) {
    refreshQuoteBtn.addEventListener('click', fetchAnimeQuote);
}

// =============== API 2: Anime Facts ===============
const factText = document.getElementById('animefactsFact');
const factSource = document.getElementById('animefactsSource');
const refreshFactBtn = document.getElementById('refreshAnimefacts');

const animeFactsList = [
    "The longest anime series is 'Sazae-san' with over 7,500 episodes and still ongoing!",
    "Studio Ghibli's 'Spirited Away' was the first anime film to win an Academy Award.",
    "The word 'anime' is derived from the English word 'animation' but in Japan it means all animation.",
    "'One Piece' has sold over 500 million copies worldwide, making it the best-selling manga series.",
    "The first anime ever made was 'Namakura Gatana' (Blunt Sword) from 1917, lasting only 4 minutes.",
    "Hayao Miyazaki, co-founder of Studio Ghibli, personally checks every frame of his movies.",
    "'Dragon Ball Z' popularized anime in the Western world during the 1990s.",
    "The voice actor for Pikachu, Ikue Otani, has been voicing the character for over 20 years.",
    "'Neon Genesis Evangelion' saved the anime industry in Japan during the 1990s economic crisis.",
    "Makoto Shinkai's 'Your Name' became the highest-grossing anime film worldwide."
];

async function fetchAnimeFact() {
    if (!factText) return;
    
    factText.textContent = 'Loading fact...';
    factText.style.opacity = '0.5';
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch('https://api.jikan.moe/v4/random/anime', { 
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        
        const data = await response.json();
        const anime = data.data;
        
        const randomFact = anime.title + ' has ' + (anime.episodes || 'unknown') + ' episodes, scored ' + (anime.score || 'N/A') + '/10 on MyAnimeList.';
        
        factText.textContent = randomFact;
        factSource.innerHTML = '<i class="fa-solid fa-code-branch"></i> Source: Jikan API | Anime: ' + anime.title;
        factText.style.opacity = '1';
        
    } catch (error) {
        console.error('API error, using local fact database:', error);
        
        const randomIndex = Math.floor(Math.random() * animeFactsList.length);
        factText.textContent = animeFactsList[randomIndex];
        factSource.innerHTML = '<i class="fa-solid fa-database"></i> Source: Local Fact Database';
        factText.style.opacity = '1';
    }
}

if (refreshFactBtn) {
    refreshFactBtn.addEventListener('click', fetchAnimeFact);
}

// =============== API 3: Random Anime Info ===============
const animeInfoText = document.getElementById('jikanFact');
const animeInfoSource = document.getElementById('jikanSource');
const refreshAnimeBtn = document.getElementById('refreshJikan');

async function fetchRandomAnime() {
    if (!animeInfoText) return;
    
    animeInfoText.textContent = 'Loading anime information...';
    animeInfoText.style.opacity = '0.5';
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch('https://api.jikan.moe/v4/random/anime', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const data = await response.json();
        const anime = data.data;
        
        const title = anime.title;
        const year = anime.year || 'Unknown';
        const score = anime.score || 'N/A';
        const episodes = anime.episodes || 'Unknown';
        const synopsis = anime.synopsis ? anime.synopsis.substring(0, 200) + '...' : 'No description available';
        
        animeInfoText.innerHTML = '<strong>📺 ' + escapeHtml(title) + '</strong><br><br>📅 Year: ' + year + ' | ⭐ Score: ' + score + '/10 | 📺 Episodes: ' + episodes + '<br><br>' + escapeHtml(synopsis);
        animeInfoSource.innerHTML = '<i class="fa-solid fa-code-branch"></i> Source: Jikan API (MyAnimeList)';
        animeInfoText.style.opacity = '1';
        
    } catch (error) {
        console.error('Jikan API error:', error);
        
        const fallbackAnime = [
            { title: "Attack on Titan", year: 2013, score: 9.0, desc: "In a world where humanity lives in cities surrounded by gigantic walls protecting them from Titans..." },
            { title: "Fullmetal Alchemist: Brotherhood", year: 2009, score: 9.1, desc: "Two brothers use alchemy to try to restore their bodies after a failed experiment..." },
            { title: "Death Note", year: 2006, score: 8.6, desc: "A genius student finds a supernatural notebook that allows him to kill anyone..." }
        ];
        const random = fallbackAnime[Math.floor(Math.random() * fallbackAnime.length)];
        animeInfoText.innerHTML = '<strong>📺 ' + random.title + '</strong><br><br>📅 Year: ' + random.year + ' | ⭐ Score: ' + random.score + '/10<br><br>' + random.desc;
        animeInfoSource.innerHTML = '<i class="fa-solid fa-database"></i> Source: Local Database (offline mode)';
        animeInfoText.style.opacity = '1';
    }
}

if (refreshAnimeBtn) {
    refreshAnimeBtn.addEventListener('click', fetchRandomAnime);
}

// =============== USER MANAGEMENT (LocalStorage) ===============
const loadUsersBtn = document.getElementById('loadUsers');
const usersListDiv = document.getElementById('usersList');

async function loadUsers() {
    if (!usersListDiv) return;
    
    try {
        users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.length === 0) {
            usersListDiv.innerHTML = '<p class="info-text"><i class="fa-solid fa-inbox"></i> No registered users</p>';
            return;
        }
        
        usersListDiv.innerHTML = '';
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.innerHTML = `
                <div>
                    <strong><i class="fa-solid fa-user"></i> ${escapeHtml(user.username)}</strong>
                    <br>
                    <small><i class="fa-solid fa-envelope"></i> ${escapeHtml(user.email)}</small>
                </div>
                <button class="delete-user" data-id="${user.id}">
                    <i class="fa-solid fa-trash"></i> DELETE
                </button>
            `;
            usersListDiv.appendChild(userDiv);
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const userId = parseInt(btn.dataset.id);
                if (confirm('Delete this user?')) {
                    users = users.filter(u => u.id !== userId);
                    saveUsers();
                    await loadUsers();
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        usersListDiv.innerHTML = '<p class="info-text error"><i class="fa-solid fa-exclamation-triangle"></i> Error loading users</p>';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

if (loadUsersBtn) {
    loadUsersBtn.addEventListener('click', loadUsers);
}

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', () => {
    fetchAnimeQuote();
    fetchAnimeFact();
    fetchRandomAnime();
});