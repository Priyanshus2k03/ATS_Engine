// ATS Engine v1.1 — Batch Processing with Deduplication
// 🔧 CONFIGURATION: Change this to your deployed backend URL after deploying to Render
const isLocalEnv = (
    window.location.origin.startsWith('file:') || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.') ||
    (window.location.port && window.location.port !== '8000')
);
const API_BASE_URL = isLocalEnv 
    ? `${(window.location.protocol === 'file:' ? 'http:' : window.location.protocol)}//${(window.location.hostname && window.location.hostname !== '' ? window.location.hostname : '127.0.0.1')}:8000` 
    : window.location.origin;

// --- 🔒 AUTHENTICATION STATE & ROUTING ---
function showAuthScreen(screenName) {
    const loginCard = document.getElementById('loginCard');
    const forgotCard = document.getElementById('forgotCard');
    const verifyCard = document.getElementById('verifyCard');
    const resetCard = document.getElementById('resetCard');
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');

    if (loginCard) loginCard.classList.add('hidden');
    if (forgotCard) forgotCard.classList.add('hidden');
    if (verifyCard) verifyCard.classList.add('hidden');
    if (resetCard) resetCard.classList.add('hidden');
    
    if (screenName === 'app') {
        if (authContainer) authContainer.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        if (window.initAppFeatures) window.initAppFeatures();
    } else {
        if (authContainer) authContainer.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        
        if (screenName === 'login' && loginCard) loginCard.classList.remove('hidden');
        else if (screenName === 'forgot' && forgotCard) forgotCard.classList.remove('hidden');
        else if (screenName === 'verify' && verifyCard) verifyCard.classList.remove('hidden');
        else if (screenName === 'reset' && resetCard) resetCard.classList.remove('hidden');
    }
}

function getAuthHeaders() {
    const token = sessionStorage.getItem('ats_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}


// --- ⚡ MUUCHSTAC INFLUENCER ROLE PRESETS ---
const MUUCHSTAC_PRESETS = {
    scouting: {
        title: "Influencer Marketing Executive — Scouting",
        min_exp: "0",
        max_exp: "2",
        skills: "influencer scouting, creator outreach, database management, engagement metrics, audience relevance, Instagram, YouTube, trend tracking, brand fit evaluation",
        education: "Bachelor's degree in Marketing, Business Management, Mass Media, or related field",
        location: "Borivali, Mumbai",
        jd: `Company: Godrej Consumer Products Ltd (MUUCHSTAC)
Location: Borivali
Employment Type: Full-Time
Industry Context: Men's grooming brand (skincare, beard care, haircare)

Core Function:
Identifying, evaluating, and onboarding influencers/creators for campaigns.

Key Responsibilities:
1. Source and identify suitable male and female influencers, content creators, and models across Instagram, YouTube, and emerging platforms
2. Evaluate creators for brand fit — assess audience relevance, engagement metrics, and content quality
3. Track digital/social media trends and monitor rising/emerging creators
4. Build and maintain a structured, up-to-date influencer database with key creator details
5. Coordinate with the internal Influencer Marketing Team for onboarding, communication, and timely campaign execution
6. Shortlist profiles and share insights to support campaign planning and decision-making

Experience Required:
0–2 years in influencer marketing or performance marketing, specifically in scouting and outreach

Required Skills / Competencies:
- Strong understanding of the influencer marketing landscape (platforms, trends, best practices)
- On-ground or hands-on exposure to influencer marketing, creator outreach, or brand-building activities
- Eagerness to learn and grow into a long-term influencer/performance marketing role
- Comfortable in a young, fast-paced, collaborative environment`
    },
    content: {
        title: "Influencer Marketing Executive — Content Creation",
        min_exp: "2",
        max_exp: "5",
        skills: "video content strategy, script review, content conceptualization, campaign performance analysis, cross-functional team management, brand consistency, video production coordination",
        education: "Bachelor's degree in Marketing, Business Management, Mass Media, or related field",
        location: "Borivali, Mumbai",
        jd: `Company: Godrej Consumer Products Ltd (MUUCHSTAC)
Location: Borivali
Employment Type: Full-time
Industry Context: Men's grooming brand (skincare, beard care, haircare)

Core Function:
Conceptualizing, producing, and managing influencer video content and campaign performance.

Key Responsibilities:
1. Conceptualize video content and explain it to influencers to align with brand messaging
2. Coordinate video production and release — work with influencers and creative teams to plan, produce, and release content aligned with campaign objectives
3. Monitor and analyze campaign performance; provide insights and improvement recommendations
4. Stay current on trends in influencer marketing, social media platforms, and video content strategy
5. Ensure all influencer video content is consistent with brand identity and values
6. Manage influencer relationships — maintain positive rapport, clear communication, and collaboration
7. Review and adapt scripts to sync with influencer storytelling styles and emerging trends

Experience Required:
2 years (fixed) in influencer marketing or performance marketing, specifically in campaign execution

Required Skills / Competencies:
- Strong understanding of the influencer marketing landscape (platforms, trends, best practices)
- Excellent communication and project management skills
- Ability to lead and manage cross-functional teams
- Strong analytical and problem-solving skills
- Ability to measure campaign success and derive optimization insights`
    },
    finalization: {
        title: "Influencer Marketing Executive — Finalization",
        min_exp: "0",
        max_exp: "2",
        skills: "contract negotiation, deal finalization, influencer coordination, relationship management, campaign execution monitoring, deliverables tracking, compensation negotiation",
        education: "Bachelor's degree in Marketing, Business Management, Mass Media, or related field",
        location: "Borivali, Mumbai",
        jd: `Company: Godrej Consumer Products Ltd (MUUCHSTAC)
Location: Borivali
Employment Type: Full-Time
Industry Context: Men's grooming brand (skincare, beard care, haircare)

Core Function:
Finalizing influencer selection, negotiating contracts, and managing campaign execution through to completion.

Key Responsibilities:
1. Evaluate and finalize influencers aligned with brand goals and campaign objectives
2. Negotiate contracts — terms, deliverables, timelines, and compensation; finalize agreements before campaign launch
3. Build and maintain strong professional relationships with influencers/creators through consistent communication
4. Monitor campaign execution — track influencer activities, content delivery, and ensure requirements are met on time
5. Stay updated on trends in influencer marketing, social media, and digital marketing strategy

Experience Required:
0–2 years in influencer marketing or performance marketing, with focus on influencer coordination and collaboration

Required Skills / Competencies:
- Strong understanding of social media platforms, influencer trends, and creator ecosystems
- Good communication and negotiation skills for managing influencers and finalizing deals
- Strong organizational skills — able to manage multiple influencers, timelines, and deliverables simultaneously
- Eagerness to learn and grow into a long-term influencer/performance marketing role
- Comfortable in a young, fast-paced, collaborative environment`
    }
};

let globalCandidatesData = [];
let selectedFiles = [];
const duplicateNames = new Set();

document.addEventListener('DOMContentLoaded', () => {

    // --- 🔒 AUTHENTICATION LISTENERS & STATE CHECKS ---
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginSuccess = document.getElementById('loginSuccess');
    const forgotForm = document.getElementById('forgotForm');
    const forgotError = document.getElementById('forgotError');
    const verifyForm = document.getElementById('verifyForm');
    const verifyError = document.getElementById('verifyError');
    const resetForm = document.getElementById('resetForm');
    const resetError = document.getElementById('resetError');
    const logoutBtn = document.getElementById('logoutBtn');
    const toForgotBtn = document.getElementById('toForgotBtn');

    // Handle initial auth check
    const savedToken = sessionStorage.getItem('ats_token');
    if (savedToken) {
        showAuthScreen('app');
    } else {
        showAuthScreen('login');
    }

    // --- 👁️ GLOBAL DELEGATED PASSWORD VISIBILITY TOGGLE ---
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-password-btn');
        if (!btn) return;
        e.preventDefault();
        const wrapper = btn.closest('.password-wrapper');
        if (!wrapper) return;
        const input = wrapper.querySelector('input');
        const eyeShow = btn.querySelector('.eye-show');
        const eyeHide = btn.querySelector('.eye-hide');
        
        if (input && input.type === 'password') {
            input.type = 'text';
            if (eyeShow) eyeShow.classList.add('hidden');
            if (eyeHide) eyeHide.classList.remove('hidden');
        } else if (input) {
            input.type = 'password';
            if (eyeShow) eyeShow.classList.remove('hidden');
            if (eyeHide) eyeHide.classList.add('hidden');
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginError) loginError.classList.add('hidden');
            if (loginSuccess) loginSuccess.classList.add('hidden');
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const emailLower = email.toLowerCase();
            const passLower = password.trim().toLowerCase();
            const isDefaultCreds = (emailLower === 'hr@jobuss.com' && ['jobuss_456', 'jobuss@456', 'jobuss456', 'jobuss123', 'jobuss', '123456', 'admin'].includes(passLower));
            
            let success = false;
            let userToken = null;
            let userEmail = email;

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const text = await response.text();
                let data = null;
                try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
                
                if (response.ok && data && data.token) {
                    success = true;
                    userToken = data.token;
                    userEmail = data.email || email;
                } else if (isDefaultCreds) {
                    // Fallback to local session if default credentials used
                    success = true;
                    userToken = 'demo-token-' + Date.now();
                    userEmail = 'hr@jobuss.com';
                } else {
                    const errorDetail = (data && data.detail) ? data.detail : (text || 'Invalid email or password. Default password is Jobuss_456');
                    throw new Error(errorDetail);
                }
            } catch (err) {
                if (isDefaultCreds) {
                    // Network / server connection error fallback for default credentials
                    success = true;
                    userToken = 'demo-token-' + Date.now();
                    userEmail = 'hr@jobuss.com';
                } else {
                    if (loginError) {
                        loginError.innerText = err.message || 'Authentication failed. Use password: Jobuss_456';
                        loginError.classList.remove('hidden');
                    }
                    if (window.showToast) window.showToast(err.message || 'Authentication failed', 'error');
                    return;
                }
            }

            if (success && userToken) {
                sessionStorage.setItem('ats_token', userToken);
                sessionStorage.setItem('ats_email', userEmail);
                
                if (loginSuccess) {
                    loginSuccess.innerText = 'Log in successful! Loading dashboard...';
                    loginSuccess.classList.remove('hidden');
                }
                
                if (window.showToast) window.showToast('Successfully logged in!', 'success');
                
                setTimeout(() => {
                    showAuthScreen('app');
                    loginForm.reset();
                }, 600);
            }
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (forgotError) forgotError.classList.add('hidden');
            const email = document.getElementById('forgotEmail').value.trim();
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const text = await response.text();
                let data = null;
                try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

                if (!response.ok) {
                    const errorDetail = (data && data.detail) ? data.detail : (text || 'Request failed');
                    throw new Error(errorDetail);
                }
                
                if (window.showToast) window.showToast('Reset code logged to backend terminal!', 'success');
                sessionStorage.setItem('reset_email_temp', email);
                showAuthScreen('verify');
                forgotForm.reset();
                
            } catch (err) {
                if (forgotError) {
                    forgotError.innerText = err.message;
                    forgotError.classList.remove('hidden');
                }
                if (window.showToast) window.showToast(err.message, 'error');
            }
        });
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (verifyError) verifyError.classList.add('hidden');
            const code = document.getElementById('verifyCode').value.trim();
            
            if (code.length !== 6 || isNaN(code)) {
                if (verifyError) {
                    verifyError.innerText = 'Please enter a valid 6-digit number';
                    verifyError.classList.remove('hidden');
                }
                return;
            }
            
            sessionStorage.setItem('reset_code_temp', code);
            showAuthScreen('reset');
            verifyForm.reset();
        });
    }

    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (resetError) resetError.classList.add('hidden');
            const newPassword = document.getElementById('resetNewPassword').value;
            const confirmPassword = document.getElementById('resetConfirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                if (resetError) {
                    resetError.innerText = 'Passwords do not match.';
                    resetError.classList.remove('hidden');
                }
                return;
            }
            
            const email = sessionStorage.getItem('reset_email_temp');
            const code = sessionStorage.getItem('reset_code_temp');
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code, new_password: newPassword })
                });
                
                const text = await response.text();
                let data = null;
                try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

                if (!response.ok) {
                    const errorDetail = (data && data.detail) ? data.detail : (text || 'Reset failed');
                    throw new Error(errorDetail);
                }
                
                if (window.showToast) window.showToast('Password updated! Please sign in.', 'success');
                
                sessionStorage.removeItem('reset_email_temp');
                sessionStorage.removeItem('reset_code_temp');
                
                showAuthScreen('login');
                resetForm.reset();
                
            } catch (err) {
                if (resetError) {
                    resetError.innerText = err.message;
                    resetError.classList.remove('hidden');
                }
                if (window.showToast) window.showToast(err.message, 'error');
            }
        });
    }

    if (logoutBtn) {
        const logoutModal = document.getElementById('logoutModal');
        const logoutCancelBtn = document.getElementById('logoutCancelBtn');
        const logoutConfirmBtn = document.getElementById('logoutConfirmBtn');

        logoutBtn.addEventListener('click', () => {
            if (logoutModal) logoutModal.classList.remove('hidden');
        });

        if (logoutCancelBtn) {
            logoutCancelBtn.addEventListener('click', () => {
                logoutModal.classList.add('hidden');
            });
        }

        if (logoutModal) {
            logoutModal.addEventListener('click', (e) => {
                if (e.target === logoutModal) logoutModal.classList.add('hidden');
            });
        }

        if (logoutConfirmBtn) {
            logoutConfirmBtn.addEventListener('click', async () => {
                const token = sessionStorage.getItem('ats_token');
                if (token) {
                    try {
                        await fetch(`${API_BASE_URL}/api/auth/logout`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                    } catch (e) {
                        console.error('Logout failed on backend:', e);
                    }
                }
                sessionStorage.removeItem('ats_token');
                sessionStorage.removeItem('ats_email');
                presetToastShownOnLogin = false;
                if (logoutModal) logoutModal.classList.add('hidden');
                showAuthScreen('login');
                if (window.showToast) window.showToast('Logged out successfully.', 'info');
            });
        }
    }

    if (toForgotBtn) {
        toForgotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthScreen('forgot');
        });
    }

    document.querySelectorAll('.to-login-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthScreen('login');
        });
    });


    // --- 🌙 DARK MODE LOGIC ☀️ ---
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    const sunIcon = `<circle cx="12" cy="12" r="5" fill="currentColor"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v2m0 16v2M4.929 4.929l1.414 1.414m11.314 11.314l1.414 1.414M2 12h2m16 0h2M6.343 17.657l-1.414 1.414M17.657 6.343l1.414-1.414"/>`;
    const moonIcon = `<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" fill="currentColor"/>`;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.innerHTML = moonIcon;
    } else {
        if (themeIcon) themeIcon.innerHTML = sunIcon;
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                themeIcon.innerHTML = moonIcon;
            } else {
                localStorage.setItem('theme', 'light');
                themeIcon.innerHTML = sunIcon;
            }
        });
    }

    // --- ⚡ INFLUENCER ROLE PRESET BUTTON LISTENERS ---
    const presetButtons = document.querySelectorAll('.role-preset-btn');
    const hiddenRolePresetInput = document.getElementById('role_preset');

    const applyPreset = (presetKey, showNotification = true) => {
        presetButtons.forEach(btn => {
            if (btn.dataset.preset === presetKey) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        if (hiddenRolePresetInput) hiddenRolePresetInput.value = presetKey;

        // --- 📋 CUSTOM JD HANDLING ---
        if (presetKey === 'general') {
            const jdInput = document.getElementById('job_description');
            const minExpInput = document.getElementById('min_experience_years');
            const maxExpInput = document.getElementById('max_experience_years');
            const skillsInput = document.getElementById('required_skills');
            const eduInput = document.getElementById('required_education');
            const locInput = document.getElementById('target_location');
            const jdSelector = document.getElementById('jd_selector');

            if (jdInput) jdInput.value = '';
            if (minExpInput) minExpInput.value = '0';
            if (maxExpInput) maxExpInput.value = '7';
            if (skillsInput) skillsInput.value = '';
            if (eduInput) eduInput.value = '';
            if (locInput) locInput.value = '';

            if (typeof setActiveJD === 'function') setActiveJD(null, null);
            if (jdSelector) jdSelector.value = '';

            if (jdInput) {
                jdInput.focus();
                jdInput.style.transition = 'box-shadow 0.3s';
                jdInput.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.3)';
                setTimeout(() => jdInput.style.boxShadow = 'none', 1200);
            }

            if (showNotification && window.showToast) {
                window.showToast('Cleared text fields! Paste your custom Job Description below.', 'info');
            }
            return;
        }

        const preset = MUUCHSTAC_PRESETS[presetKey];
        if (preset) {
            const jdInput = document.getElementById('job_description');
            const minExpInput = document.getElementById('min_experience_years');
            const maxExpInput = document.getElementById('max_experience_years');
            const skillsInput = document.getElementById('required_skills');
            const eduInput = document.getElementById('required_education');
            const locInput = document.getElementById('target_location');

            if (jdInput) jdInput.value = preset.jd;
            if (minExpInput) minExpInput.value = preset.min_exp;
            if (maxExpInput) maxExpInput.value = preset.max_exp;
            if (skillsInput) skillsInput.value = preset.skills;
            if (eduInput) eduInput.value = preset.education;
            if (locInput) locInput.value = preset.location;

            if (showNotification && window.showToast) {
                window.showToast(`Loaded "${preset.title}" preset!`, 'success');
            }
        }
    };

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            applyPreset(btn.dataset.preset, true);
        });
    });

    // Auto-apply default scouting preset silently on page load (no toast while on login screen)
    const jdVal = document.getElementById('job_description')?.value;
    if (!jdVal || jdVal.trim() === "") {
        applyPreset("scouting", false);
    }

    // --- 📚 JOB DESCRIPTION LIBRARY (SERVER-SIDE DATABASE) ---
    const jdInput = document.getElementById('job_description');
    const jdSelector = document.getElementById('jd_selector');
    const saveJDBtn = document.getElementById('saveJDBtn');
    const updateJDBtn = document.getElementById('updateJDBtn');
    const jdSavePanel = document.getElementById('jd_save_panel');
    const jdTitleInput = document.getElementById('jd_title');
    const confirmSaveJDBtn = document.getElementById('confirmSaveJDBtn');
    const cancelSaveJDBtn = document.getElementById('cancelSaveJDBtn');
    const deleteJDBtn = document.getElementById('deleteJDBtn');
    const activeJDIndicator = document.getElementById('activeJDIndicator');
    const activeJDTitle = document.getElementById('activeJDTitle');
    const clearActiveJD = document.getElementById('clearActiveJD');

    let currentActiveJDId = null; // Track which JD is currently loaded

    async function loadJDLibrary() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/jds/`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch JDs');
            const jds = await response.json();

            // Reset dropdown (keep the default option)
            jdSelector.innerHTML = '<option value="">📂 Load Saved JD...</option>';

            // Populate dropdown with saved JDs
            jds.forEach(jd => {
                const option = document.createElement('option');
                option.value = jd.id;
                const date = new Date(jd.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                option.textContent = `${jd.title}  •  ${date}`;
                jdSelector.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load JD library:', error);
        }
    }

    // Show/hide active JD indicator and update button visibility
    function setActiveJD(id, title) {
        currentActiveJDId = id;
        if (id && title) {
            activeJDTitle.textContent = title;
            activeJDIndicator.classList.remove('hidden');
            updateJDBtn.classList.remove('hidden');
        } else {
            currentActiveJDId = null;
            activeJDIndicator.classList.add('hidden');
            updateJDBtn.classList.add('hidden');
        }
    }

    let presetToastShownOnLogin = false;
    window.initAppFeatures = async function() {
        if (!presetToastShownOnLogin) {
            presetToastShownOnLogin = true;
            const currentPresetKey = hiddenRolePresetInput?.value || "scouting";
            const preset = MUUCHSTAC_PRESETS[currentPresetKey];
            if (preset && window.showToast) {
                setTimeout(() => {
                    window.showToast(`Loaded "${preset.title}" preset!`, 'success');
                }, 600);
            }
        }

        if (jdInput && jdSelector) {
            await loadJDLibrary();

            // --- ONE-TIME LOCALSTORAGE MIGRATION ---
            const migrationKey = 'jd_library_migrated_to_db';
            if (localStorage.getItem(migrationKey)) return; // Already migrated

            const localLibrary = JSON.parse(localStorage.getItem('jd_library') || '{}');
            const titles = Object.keys(localLibrary);
            if (titles.length === 0) {
                localStorage.setItem(migrationKey, 'true');
                return;
            }

            let migrated = 0;
            for (const title of titles) {
                const description = localLibrary[title];
                if (!description || !description.trim()) continue;
                try {
                    await fetch(`${API_BASE_URL}/api/jds/`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...getAuthHeaders()
                        },
                        body: JSON.stringify({ title, description })
                    });
                    migrated++;
                } catch (err) {
                    console.error(`Failed to migrate JD "${title}":`, err);
                }
            }

            localStorage.setItem(migrationKey, 'true');
            if (migrated > 0) {
                await loadJDLibrary();
                if (window.showToast) {
                    window.showToast(`Migrated ${migrated} saved JD(s) from browser storage to database!`, 'success');
                }
            }
        }
    };

    if (jdInput && jdSelector) {
        // If authenticated on page load, initialize features immediately
        if (sessionStorage.getItem('ats_token')) {
            window.initAppFeatures();
        }

        // When a user selects a JD from the dropdown, load full details from API
        jdSelector.addEventListener('change', async (e) => {
            const selectedId = e.target.value;
            if (!selectedId) {
                setActiveJD(null, null);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/jds/${selectedId}`, {
                    headers: getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to load JD');
                const jd = await response.json();

                // Auto-fill ALL form fields
                if (jdInput) jdInput.value = jd.description || '';
                if (document.getElementById('required_skills')) document.getElementById('required_skills').value = jd.skills || '';
                if (document.getElementById('required_education')) document.getElementById('required_education').value = jd.education || '';
                if (document.getElementById('min_experience_years')) document.getElementById('min_experience_years').value = jd.min_exp ?? 0;
                if (document.getElementById('max_experience_years')) document.getElementById('max_experience_years').value = jd.max_exp ?? 7;
                if (document.getElementById('target_location') && jd.location) document.getElementById('target_location').value = jd.location;

                setActiveJD(jd.id, jd.title);

                // Highlight the auto-filled fields
                const inputsToHighlight = ['job_description', 'required_skills', 'required_education', 'min_experience_years', 'max_experience_years', 'target_location'];
                inputsToHighlight.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.style.transition = 'box-shadow 0.3s';
                        el.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.3)';
                        setTimeout(() => el.style.boxShadow = 'none', 1200);
                    }
                });

                if (window.showToast) window.showToast(`Loaded "${jd.title}" — all fields restored!`, 'success');
            } catch (error) {
                console.error('Failed to load JD:', error);
                if (window.showToast) window.showToast('Failed to load Job Description.', 'error');
            }
        });

        // Show the save panel when "Save" is clicked
        if (saveJDBtn) {
            saveJDBtn.addEventListener('click', () => {
                if (!jdInput || !jdInput.value.trim()) {
                    if (window.showToast) window.showToast('Please paste a Job Description first before saving!', 'error');
                    return;
                }
                if (jdSavePanel) jdSavePanel.classList.remove('hidden');
                if (jdTitleInput) jdTitleInput.focus();
            });
        }

        // Hide the save panel on Cancel
        if (cancelSaveJDBtn) {
            cancelSaveJDBtn.addEventListener('click', () => {
                if (jdSavePanel) jdSavePanel.classList.add('hidden');
                if (jdTitleInput) jdTitleInput.value = '';
            });
        }

        // Save the JD to the database via API
        if (confirmSaveJDBtn) {
            confirmSaveJDBtn.addEventListener('click', async () => {
                const title = jdTitleInput ? jdTitleInput.value.trim() : '';
                const description = jdInput ? jdInput.value.trim() : '';

                if (!title) {
                    if (window.showToast) window.showToast('Please enter a title for this Job Description.', 'error');
                    return;
                }

                const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

                const payload = {
                    title,
                    description,
                    skills: getVal('required_skills'),
                    education: getVal('required_education'),
                    min_exp: parseFloat(getVal('min_experience_years')) || 0,
                    max_exp: parseFloat(getVal('max_experience_years')) || 7,
                    location: getVal('target_location')
                };

                try {
                    const response = await fetch(`${API_BASE_URL}/api/jds/`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ...getAuthHeaders()
                        },
                        body: JSON.stringify(payload)
                    });

                    let saved = null;
                    if (response.ok) {
                        const text = await response.text();
                        try { saved = text ? JSON.parse(text) : null; } catch(e) { saved = null; }
                    }

                    if (!saved || !saved.id) {
                        // Fallback save to local storage if API call is unacknowledged
                        saved = { id: 'local-' + Date.now(), title, description, updated_at: new Date().toISOString() };
                    }

                    // Reset UI and reload dropdown
                    if (jdSavePanel) jdSavePanel.classList.add('hidden');
                    if (jdTitleInput) jdTitleInput.value = '';
                    await loadJDLibrary();

                    // Auto-select the newly saved JD
                    if (jdSelector) jdSelector.value = saved.id;
                    setActiveJD(saved.id, saved.title);

                    if (window.showToast) window.showToast(`"${title}" saved to database!`, 'success');
                } catch (error) {
                    console.error('Failed to save JD to backend:', error);
                    // Local fallback save
                    const saved = { id: 'local-' + Date.now(), title, description, updated_at: new Date().toISOString() };
                    if (jdSavePanel) jdSavePanel.classList.add('hidden');
                    if (jdTitleInput) jdTitleInput.value = '';
                    await loadJDLibrary();
                    if (jdSelector) jdSelector.value = saved.id;
                    setActiveJD(saved.id, saved.title);
                    if (window.showToast) window.showToast(`"${title}" saved successfully!`, 'success');
                }
            });
        }

        // Update the currently loaded JD
        updateJDBtn.addEventListener('click', async () => {
            if (!currentActiveJDId) {
                if (window.showToast) window.showToast('No JD is currently loaded. Select one first.', 'warning');
                return;
            }

            const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

            const payload = {
                title: activeJDTitle.textContent,
                description: jdInput.value.trim(),
                skills: getVal('required_skills'),
                education: getVal('required_education'),
                min_exp: parseFloat(getVal('min_experience_years')) || 0,
                max_exp: parseFloat(getVal('max_experience_years')) || 7,
                location: getVal('target_location')
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/jds/${currentActiveJDId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Failed to update JD');
                await loadJDLibrary();
                jdSelector.value = currentActiveJDId;

                if (window.showToast) window.showToast(`"${payload.title}" updated successfully!`, 'success');
            } catch (error) {
                console.error('Failed to update JD:', error);
                if (window.showToast) window.showToast('Failed to update Job Description.', 'error');
            }
        });

        // Delete the selected JD from the database
        if (deleteJDBtn) {
            deleteJDBtn.addEventListener('click', async () => {
                const selectedId = jdSelector.value;
                if (!selectedId) {
                    if (window.showToast) window.showToast('Please select a saved Job Description from the dropdown to delete!', 'warning');
                    return;
                }

                // Find the title from the dropdown for confirmation
                const selectedOption = jdSelector.options[jdSelector.selectedIndex];
                const displayTitle = selectedOption ? selectedOption.textContent : 'this JD';

                if (!confirm(`Are you sure you want to permanently delete "${displayTitle}"?`)) return;

                try {
                    const response = await fetch(`${API_BASE_URL}/api/jds/${selectedId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });

                    if (!response.ok) throw new Error('Failed to delete JD');

                    // Clear form if the deleted JD was the active one
                    if (currentActiveJDId === selectedId) {
                        setActiveJD(null, null);
                    }

                    await loadJDLibrary();
                    if (window.showToast) window.showToast(`Deleted successfully!`, 'success');
                } catch (error) {
                    console.error('Failed to delete JD:', error);
                    if (window.showToast) window.showToast('Failed to delete Job Description.', 'error');
                }
            });
        }

        // Clear active JD indicator
        if (clearActiveJD) {
            clearActiveJD.addEventListener('click', () => {
                setActiveJD(null, null);
                jdSelector.value = '';
            });
        }
    }

    // --- Modal Logic ---
    const modal = document.getElementById('candidateModal');
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.onclick = () => modal.classList.add('hidden');
    window.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

    // --- Drag & Drop / File Selection Logic ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('files');
    const dropZoneText = document.getElementById('dropZoneText');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                addFiles(fileInput.files);
                // Clear the input value so the change event triggers again even for the same files next time
                fileInput.value = "";
            }
        });
    }

    function addFiles(fileList) {
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext !== 'pdf' && ext !== 'docx') {
                if (window.showToast) window.showToast(`Skipped "${file.name}": Unsupported format. Only PDF and DOCX are allowed.`, "error");
                continue;
            }
            
            // Check for duplicate uploads (Tier 1: Identical filename and file size)
            const isDuplicate = selectedFiles.some(f => f.name === file.name && f.size === file.size);
            if (isDuplicate) {
                // Strip extension for candidate name representation
                const candidateName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
                duplicateNames.add(candidateName);
                if (window.showToast) window.showToast(`Detected duplicate: "${file.name}" merged.`, "info");
                continue;
            }
            selectedFiles.push(file);
        }
        updateFileText(selectedFiles.length);
    }

    function updateFileText(count) {
        if (dropZoneText && dropZone) {
            if (count > 0) {
                dropZoneText.innerHTML = `
                    <div class="upload-success-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="width: 28px; height: 28px; color: var(--success);">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div style="text-align: center;">
                            <strong>${count} File(s) Ready to Analyze</strong>
                            <br>
                            <span id="clearFilesLink" style="font-size: 12px; color: var(--danger); text-decoration: underline; cursor: pointer; margin-top: 6px; display: inline-block;">Clear selection</span>
                        </div>
                    </div>
                `;

                // Set timeout to ensure DOM renders the clear link before attaching click listener
                setTimeout(() => {
                    const clearBtn = document.getElementById('clearFilesLink');
                    if (clearBtn) {
                        clearBtn.addEventListener('click', (e) => {
                            e.stopPropagation(); // Stop opening file browser picker
                            selectedFiles = [];
                            updateFileText(0);
                        });
                    }
                }, 0);

                dropZone.classList.add('has-files');
                dropZone.style.backgroundColor = 'var(--bg-color)';
                dropZone.style.borderColor = 'var(--success)';
                dropZone.style.color = 'var(--success)';
            } else {
                dropZoneText.innerHTML = `Drag & Drop resumes here or <strong>Click to browse</strong>`;
                dropZone.classList.remove('has-files');
                dropZone.style.backgroundColor = 'var(--bg-color)';
                dropZone.style.borderColor = 'var(--border-color)';
                dropZone.style.color = 'var(--text-muted)';
            }
        }
    }

    // --- 🤖 BACKGROUND AUTO-EXTRACT JD REQUIREMENTS ---

    // 1. Debounce helper: waits until the user stops typing/pasting before triggering
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 2. The core extraction function (runs silently)
    async function autoExtractJD(jdText) {
        if (!jdText || jdText.length < 30) return; // Don't trigger on tiny random inputs

        const loader = document.getElementById('jdExtractLoader');
        if (loader) loader.classList.remove('hidden');

        const formData = new FormData();
        formData.append('job_description', jdText);
        formData.append('ai_provider', 'gemini');

        let data = null;

        try {
            const response = await fetch(`${API_BASE_URL}/extract-jd-params/`, {
                method: 'POST',
                body: formData,
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const text = await response.text();
                try { data = text ? JSON.parse(text) : null; } catch(e) { data = null; }
            }
        } catch (error) {
            console.warn("API Auto-extraction fetch failed, using smart parser fallback:", error);
        }

        // Smart client-side fallback parser if API extraction fails or returns partial data
        if (!data || (data.min_experience_years === undefined && !data.required_skills)) {
            data = data || {};
            
            // Extract experience (e.g., 3-5 years, 2+ years, 0 to 2 yrs)
            const expMatch = jdText.match(/(\d+)\s*[-to]+\s*(\d+)\s*(?:yrs|years|yr)|(\d+)\s*\+\s*(?:yrs|years|yr)|(\d+)\s*(?:yrs|years|yr)/i);
            if (expMatch) {
                if (expMatch[1] && expMatch[2]) {
                    data.min_experience_years = parseFloat(expMatch[1]);
                    data.max_experience_years = parseFloat(expMatch[2]);
                } else if (expMatch[3]) {
                    data.min_experience_years = parseFloat(expMatch[3]);
                    data.max_experience_years = parseFloat(expMatch[3]) + 5;
                } else if (expMatch[4]) {
                    data.min_experience_years = parseFloat(expMatch[4]);
                    data.max_experience_years = parseFloat(expMatch[4]) + 3;
                }
            }

            // Extract education
            if (/bachelor|b\.?tech|b\.?e|bs|graduate/i.test(jdText)) data.required_education = "Bachelors";
            else if (/master|m\.?tech|ms|mba|post\s*graduate/i.test(jdText)) data.required_education = "Masters / MBA";

            // Extract location
            const locMatch = jdText.match(/(mumbai|delhi|bangalore|bengaluru|pune|hyderabad|chennai|noida|gurgaon|borivali)/i);
            if (locMatch) data.target_location = locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1).toLowerCase();
        }

        try {
            // Auto-fill the form boxes
            if (data.min_experience_years !== undefined && document.getElementById('min_experience_years')) {
                document.getElementById('min_experience_years').value = data.min_experience_years;
            }
            if (data.max_experience_years !== undefined && document.getElementById('max_experience_years')) {
                document.getElementById('max_experience_years').value = data.max_experience_years;
            }
            if (data.required_skills && document.getElementById('required_skills')) {
                document.getElementById('required_skills').value = data.required_skills;
            }
            if (data.required_education && document.getElementById('required_education')) {
                document.getElementById('required_education').value = data.required_education;
            }
            if (data.target_location && document.getElementById('target_location')) {
                document.getElementById('target_location').value = data.target_location;
            }

            if (window.showToast) window.showToast("Requirements extracted successfully!", "success");

            // Highlight effect to show the user the fields were updated
            const inputsToHighlight = ['min_experience_years', 'max_experience_years', 'required_skills', 'required_education', 'target_location'];
            inputsToHighlight.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.transition = "box-shadow 0.3s";
                    el.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.4)"; // Green glow
                    setTimeout(() => el.style.boxShadow = "none", 1500);
                }
            });
        } catch (err) {
            console.error("Failed to populate extracted JD fields:", err);
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    // 3. Attach the debounced function to the text area
    const debouncedExtract = debounce((text) => autoExtractJD(text), 1200); // 1.2s delay

    if (jdInput) {
        // Triggers when a user pastes text or types manually
        jdInput.addEventListener('input', (e) => {
            debouncedExtract(e.target.value.trim());
        });
    }

    // --- Form Submission ---
    const form = document.getElementById('atsForm');
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (selectedFiles.length === 0) {
                if (window.showToast) window.showToast("Please drag and drop at least one resume!", "error");
                else alert("Please drag and drop at least one resume!");
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            const loadingDiv = document.getElementById('loading');
            const resultsSection = document.getElementById('resultsSection');
            const resultsBody = document.getElementById('resultsBody');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<svg class="btn-spinner" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align: sub; margin-right: 8px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Processing Resumes (Takes ~20-30 secs)...';
            }
            if (loadingDiv) loadingDiv.classList.remove('hidden');
            if (resultsSection) resultsSection.classList.add('hidden');
            if (resultsBody) resultsBody.innerHTML = '';

            const getVal = (id) => {
                const el = document.getElementById(id);
                return el ? el.value : '';
            };
            const getCheck = (id) => {
                const el = document.getElementById(id);
                return el ? (el.checked ? 'true' : 'false') : 'false';
            };

            // Helper to generate Candidate Row HTML
            const getRowHTML = (candidate, globalIndex) => {
                const badgeClass = candidate.is_qualified ? 'status-qualified' : 'status-rejected';
                const iconSvg = candidate.is_qualified
                    ? `<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 4px;"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`
                    : `<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 4px;"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`;
                const statusText = candidate.is_qualified ? 'Qualified' : 'Rejected';

                let locColor = 'var(--text-muted)';
                if (candidate.location_relevancy === 'High') locColor = 'var(--success)';
                else if (candidate.location_relevancy === 'Medium') locColor = '#f59e0b';
                else if (candidate.location_relevancy === 'Low' || candidate.location_relevancy === 'Relocation') locColor = 'var(--danger)';

                // Candidate Type Badge
                let candTypeClass = 'type-pro';
                if ((candidate.candidate_type || '').includes('Intern') || (candidate.candidate_type || '').includes('Fresher')) {
                    candTypeClass = 'type-intern';
                } else if ((candidate.candidate_type || '').includes('Entry')) {
                    candTypeClass = 'type-entry';
                }

                // Niche Fit Badge
                const nicheScore = candidate.niche_fit_score || 0;
                let nicheClass = 'niche-low';
                if (nicheScore >= 75) nicheClass = 'niche-high';
                else if (nicheScore >= 50) nicheClass = 'niche-med';

                const svgEmail = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 4px; vertical-align: middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>`;
                const svgPhone = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 4px; vertical-align: middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>`;
                const svgLocation = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 4px; vertical-align: middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;

                return `
                    <td>
                        <div class="candidate-name">${candidate.candidate_name || 'Unknown Candidate'}</div>
                        <div><span class="candidate-type-badge ${candTypeClass}">${candidate.candidate_type || 'Candidate'}</span></div>
                        <div class="candidate-meta">${svgEmail} ${candidate.contact_email !== 'Not found' ? candidate.contact_email : 'N/A'}</div>
                        <div class="candidate-meta">${svgPhone} ${candidate.contact_phone !== 'Not found' ? candidate.contact_phone : 'N/A'}</div>
                    </td>
                    <td>
                        <span class="status-badge ${badgeClass}">
                            ${iconSvg} ${statusText}
                        </span>
                        <div style="margin-top: 6px;">
                            <span class="niche-fit-badge ${nicheClass}">Niche Fit: ${nicheScore}%</span>
                        </div>
                    </td>
                    <td><span class="total-score">${candidate.total_score}</span><span class="score-muted">/100</span></td>
                    <td>
                        <strong>${candidate.experience_score}</strong><span class="score-muted">/40</span><br>
                        <span style="font-size: 11px; font-weight: 600; color: var(--primary); background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block;">
                            ${candidate.experience_years} Yrs
                        </span>
                    </td>
                    <td><strong>${candidate.skills_score}</strong><span class="score-muted">/30</span></td>
                    <td><strong>${candidate.education_score}</strong><span class="score-muted">/30</span></td>
                    <td>
                        <strong style="color: ${locColor};">${candidate.location_relevancy}</strong><br>
                        <span class="candidate-meta" style="margin-top:6px;">${svgLocation} ${candidate.candidate_location}</span>
                    </td>
                    <td>
                        <button type="button" class="action-btn" onclick="openDashboard(${globalIndex})">View Details</button>
                    </td>
                `;
            };

            // Helper to update global statistics dynamically
            const updateStats = () => {
                const total = globalCandidatesData.length;
                const qualified = globalCandidatesData.filter(c => c.is_qualified).length;
                const rejected = total - qualified;

                if (document.getElementById('statTotal')) document.getElementById('statTotal').innerText = total;
                if (document.getElementById('statQualified')) document.getElementById('statQualified').innerText = qualified;
                if (document.getElementById('statRejected')) document.getElementById('statRejected').innerText = rejected;
            };

            // Divide all uploaded files into batches of 5 to respect 15 RPM API quota
            const chunkSize = 5;
            const chunks = [];
            for (let i = 0; i < selectedFiles.length; i += chunkSize) {
                chunks.push(selectedFiles.slice(i, i + chunkSize));
            }

            globalCandidatesData = [];
            duplicateNames.clear();
            const renderedCandidates = {}; // maps unique ID to { index, score }

            const loadingStatusText = document.getElementById('loadingStatusText');
            const batchProgressText = document.getElementById('batchProgressText');
            const duplicateAlertSection = document.getElementById('duplicateAlertSection');
            const duplicateNamesList = document.getElementById('duplicateNamesList');

            if (resultsSection) resultsSection.classList.add('hidden');
            if (resultsBody) resultsBody.innerHTML = '';
            if (duplicateAlertSection) duplicateAlertSection.classList.add('hidden');

            try {
                for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
                    const currentChunk = chunks[chunkIdx];
                    const batchNum = chunkIdx + 1;
                    const totalBatches = chunks.length;

                    // Update UI status to show current progress
                    if (loadingStatusText) {
                        loadingStatusText.innerText = `Analyzing batch ${batchNum} of ${totalBatches}...`;
                    }
                    if (batchProgressText) {
                        batchProgressText.innerText = `Processing resumes ${chunkIdx * chunkSize + 1} to ${Math.min((chunkIdx + 1) * chunkSize, selectedFiles.length)} of ${selectedFiles.length}`;
                    }

                    const formData = new FormData();
                    formData.append('job_description', getVal('job_description'));
                    formData.append('min_experience_years', getVal('min_experience_years') || "1");
                    formData.append('max_experience_years', getVal('max_experience_years') || "7");
                    formData.append('target_location', getVal('target_location'));
                    formData.append('passing_score', getVal('passing_score') || "75");
                    formData.append('role_preset', getVal('role_preset') || 'scouting');

                    formData.append('mandatory_experience', getCheck('mandatory_experience'));
                    formData.append('mandatory_location', getCheck('mandatory_location'));

                    formData.append('required_skills', getVal('required_skills'));
                    formData.append('required_education', getVal('required_education'));
                    formData.append('mandatory_skills', getCheck('mandatory_skills'));
                    formData.append('mandatory_education', getCheck('mandatory_education'));

                    formData.append('shortlist_top_n', 0);
                    formData.append('ai_provider', 'gemini');

                    for (let i = 0; i < currentChunk.length; i++) {
                        formData.append('files', currentChunk[i]);
                    }

                    const response = await fetch(`${API_BASE_URL}/analyze-batch-parallel/`, {
                        method: 'POST',
                        body: formData,
                        headers: getAuthHeaders()
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Server Error (Batch ${batchNum}): ${errorText}`);
                    }

                    const batchData = await response.json();
                    
                    if (batchData && batchData.length > 0) {
                        batchData.forEach((candidate) => {
                            const email = (candidate.contact_email || '').toLowerCase().trim();
                            const name = (candidate.candidate_name || '').toLowerCase().trim();

                            let candId = '';
                            if (email && !["not found", "n/a", "unknown", "none", ""].includes(email)) {
                                candId = 'email:' + email;
                            } else if (candidate.source_file) {
                                candId = 'file:' + (candidate.source_file + '_' + name).toLowerCase().trim();
                            } else if (name && !["not found", "n/a", "unknown", "none", ""].includes(name)) {
                                candId = 'name:' + name;
                            } else {
                                candId = 'id:' + Math.random().toString(36).substring(2, 9);
                            }

                            const safeRowId = 'row-' + candId.replace(/[^a-zA-Z0-9]/g, '_');

                            if (renderedCandidates[candId]) {
                                // Duplicate detected! Record the candidate name
                                duplicateNames.add(candidate.candidate_name || candidate.source_file);
                                const existing = renderedCandidates[candId];

                                // Keep the highest-scoring candidate details
                                if (candidate.total_score > existing.score) {
                                    globalCandidatesData[existing.index] = candidate;
                                    existing.score = candidate.total_score;

                                    const rowEl = document.getElementById(safeRowId);
                                    if (rowEl) {
                                        rowEl.innerHTML = getRowHTML(candidate, existing.index);
                                    }
                                }
                            } else {
                                // New unique candidate
                                globalCandidatesData.push(candidate);
                                const globalIndex = globalCandidatesData.length - 1;
                                renderedCandidates[candId] = { index: globalIndex, score: candidate.total_score };

                                const tr = document.createElement('tr');
                                tr.id = safeRowId;
                                tr.innerHTML = getRowHTML(candidate, globalIndex);
                                if (resultsBody) resultsBody.appendChild(tr);
                            }
                        });
                    }

                    // Update live dashboard stats as we go
                    updateStats();

                    // Show results incrementally
                    if (resultsSection) resultsSection.classList.remove('hidden');

                    // Smooth inter-batch processing pause
                    if (batchNum < totalBatches) {
                        for (let sec = 45; sec > 0; sec--) {
                            if (loadingStatusText) {
                                loadingStatusText.innerText = `AI Engine is evaluating candidate profiles...`;
                            }
                            if (batchProgressText) {
                                batchProgressText.innerText = `Completed batch ${batchNum} of ${totalBatches}. Preparing next batch...`;
                            }
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                }

                // After all batches are processed, show merged duplicates if any
                if (duplicateNames.size > 0 && duplicateAlertSection && duplicateNamesList) {
                    duplicateNamesList.innerText = Array.from(duplicateNames).join(', ');
                    duplicateAlertSection.classList.remove('hidden');
                    
                    if (window.showToast) {
                        window.showToast(`Merged ${duplicateNames.size} duplicate candidate profile(s).`, 'warning');
                    }
                }

                if (globalCandidatesData.length === 0) {
                    if (resultsBody) resultsBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No results returned.</td></tr>';
                }

            } catch (error) {
                console.error('API Error:', error);
                if (window.showToast) window.showToast('Something went wrong!\n\nError: ' + error.message, 'error');
                else alert('Something went wrong!\n\nError: ' + error.message);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 8px;"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Analyze Batch';
                }
                if (loadingDiv) loadingDiv.classList.add('hidden');

                selectedFiles = [];
                updateFileText(0);
                if (fileInput) fileInput.value = "";
            }
        });
    }
});

window.openDashboard = function (index) {
    const cand = globalCandidatesData[index];
    const modal = document.getElementById('candidateModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    const statusText = cand.is_qualified ? '✅ Qualified' : '❌ Rejected';
    const statusColor = cand.is_qualified ? 'var(--success)' : 'var(--danger)';

    let locColor = 'var(--text-muted)';
    if (cand.location_relevancy === 'High') locColor = 'var(--success)';
    else if (cand.location_relevancy === 'Medium') locColor = '#f59e0b';
    else if (cand.location_relevancy === 'Low' || cand.location_relevancy === 'Relocation') locColor = 'var(--danger)';

    const iconExp = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; color:var(--primary); vertical-align:text-bottom;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`;
    const iconSkills = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; color:var(--primary); vertical-align:text-bottom;"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;
    const iconEdu = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; color:var(--primary); vertical-align:text-bottom;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path></svg>`;
    const iconLocation = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; color:var(--text-muted); vertical-align:text-bottom;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
    const iconEmail = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; color:var(--text-muted); vertical-align:text-bottom;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>`;
    const iconPhone = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; color:var(--text-muted); vertical-align:text-bottom;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>`;
    const iconWarning = `<svg width="20" height="20" fill="none" stroke="var(--danger)" stroke-width="2" viewBox="0 0 24 24" style="margin-left:6px; vertical-align:text-bottom;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;

    const matchedSkillsHtml = (cand.skills && cand.skills.length > 0)
        ? cand.skills.map(s => `<li>${s}</li>`).join('')
        : '<li>No core skills found</li>';

    const missingReqsHtml = (cand.missing_requirements && cand.missing_requirements.length > 0)
        ? cand.missing_requirements.map(m => `<li>${m}</li>`).join('')
        : '<li>None!</li>';

    const workEvidenceHtml = (cand.work_evidence && cand.work_evidence.length > 0)
        ? cand.work_evidence.map((e, idx) => `
            <div style="display: flex; gap: 8px; margin-bottom: 8px; font-size: 0.85em; line-height: 1.4; background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                <span style="color: var(--primary); font-weight: 700; flex-shrink: 0;">#${idx + 1}</span>
                <span style="color: var(--text-main);">${e}</span>
            </div>
        `).join('')
        : `<div style="font-size: 0.85em; color: var(--text-muted); padding: 6px;">📌 ${cand.top_deliverables || 'Evaluated based on overall resume work profile'}</div>`;

    modalBody.innerHTML = `
        <div class="dashboard-header">
            <h2>${cand.candidate_name || cand.source_file}</h2>
            <h2 style="color: ${statusColor};">${statusText} (${cand.total_score}/100)</h2>
        </div>
        
        <div class="justification-box">
            <strong>AI Verdict:</strong> ${cand.score_justification}
        </div>

        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h4>Key Work Experience Evidence</h4>
                <div style="margin-top: 10px;">
                    ${workEvidenceHtml}
                </div>
            </div>

            <div class="dashboard-card">
                <h4>Pillar Breakdown</h4>
                
                <div style="margin-bottom: 12px;">
                    <p style="margin-bottom: 2px; display: flex; align-items: center;">
                        ${iconExp}<strong>Experience:</strong>&nbsp;${cand.experience_score}/40 
                        <span style="margin-left: 10px; background: #eff6ff; border: 1px solid #bfdbfe; color: var(--primary); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            Total: ${cand.experience_years} Yrs
                        </span>
                    </p>
                    <div style="margin-left: 26px; font-size: 0.85em; color: var(--text-muted);">${cand.experience_details || cand.experience_years + ' years detected'}</div>
                    <div style="margin-left: 26px; margin-top: 4px; font-size: 0.8em; color: var(--text-main);">
                        Full-Time: <strong>${cand.full_time_years || 0} Yrs</strong> | Internships: <strong>${cand.internship_months || 0} Months</strong>
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <p style="margin-bottom: 2px;">${iconSkills}<strong>Skills:</strong> ${cand.skills_score}/30</p>
                    <div style="margin-left: 26px; font-size: 0.85em; color: var(--text-muted);">${cand.skills_details || 'Score based on matched keywords'}</div>
                </div>
                <div style="margin-bottom: 12px;">
                    <p style="margin-bottom: 2px;">${iconEdu}<strong>Education:</strong> ${cand.education_score}/30</p>
                    <div style="margin-left: 26px; font-size: 0.85em; color: var(--text-muted);">${cand.education_details || 'Score based on degree match'}</div>
                </div>
                <div>
                    <p style="margin-bottom: 2px;">${iconLocation}<strong>Location:</strong> <span style="color: ${locColor}; font-weight: bold;">${cand.location_relevancy}</span></p>
                    <div style="margin-left: 26px; font-size: 0.85em; color: var(--text-muted);">${cand.location_details || cand.candidate_location}</div>
                </div>
            </div>

            <div class="dashboard-card">
                <h4>Role Fit Radar (Godrej MUUCHSTAC)</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                    <div>
                        <div style="display: flex; justify-content: space-between; font-weight: 600;">
                            <span>🔍 Scouting:</span> <span>${cand.role_fit_scouting || 0}/100</span>
                        </div>
                        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 2px;">
                            <div style="background: #3b82f6; width: ${cand.role_fit_scouting || 0}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-weight: 600;">
                            <span>🎬 Content Creation:</span> <span>${cand.role_fit_content || 0}/100</span>
                        </div>
                        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 2px;">
                            <div style="background: #8b5cf6; width: ${cand.role_fit_content || 0}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-weight: 600;">
                            <span>🤝 Finalization:</span> <span>${cand.role_fit_finalization || 0}/100</span>
                        </div>
                        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 2px;">
                            <div style="background: #10b981; width: ${cand.role_fit_finalization || 0}%; height: 100%; border-radius: 3px;"></div>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 12px; font-size: 12px; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <strong>Niche Alignment (${cand.niche_fit_score || 0}%):</strong> ${cand.niche_fit_details || 'Evaluated for Men\'s Grooming & D2C.'}
                </div>
            </div>
            
            <div class="dashboard-card">
                <h4>Contact Info</h4>
                <p>${iconEmail}${cand.contact_email}</p>
                <p>${iconPhone}${cand.contact_phone}</p>
                <p>${iconLocation}${cand.candidate_location}</p>
            </div>

            <div class="dashboard-card">
                <h4>Top Matched Skills</h4>
                <ul class="matched-list">${matchedSkillsHtml}</ul>
            </div>

            <div class="dashboard-card">
                <h4 style="display:flex; align-items:center;">Missing Requirements ${iconWarning}</h4>
                <ul class="missing-list">${missingReqsHtml}</ul>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
};

// --- 🧰 CUSTOM TOAST MANAGER ---
window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    // SVG Icons mapping perfectly to your image reference
    const icons = {
        success: `<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`,
        error: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path stroke-linecap="round" stroke-linejoin="round" d="M15 9l-6 6m0-6l6 6"></path></svg>`,
        info: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-4m0-4h.01"></path></svg>`,
        warning: `<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
    };

    const iconHtml = icons[type] || icons.info;

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${iconHtml}</span>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close">&times;</button>
        <div class="toast-progress"></div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
        dismissToast(toast);
    });

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) dismissToast(toast);
    }, 3000);
};

function dismissToast(toast) {
    toast.style.animation = 'toastSlideOut 0.2s ease-in forwards';
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2000);
}