import { buildComponents } from "./components";
import { API_URL } from "./config";
import { safeLink } from "./site-nav";

const toggleInterface = (toggle: HTMLElement, uiID: string) => {
    const ui = document.getElementById(uiID);

    let data = toggle.dataset;
    data.active = (data.active === 'true') ? 'false' : 'true';

    if (ui) {
        ui.style.display = (data.active === 'true') ? 'flex' : 'none';
    }
}

const tryLogin = async (username?: string, password?: string) => {
    const usernameLogin = username || document.getElementById('username-login')?.textContent;
    const passwordLogin = password || document.getElementById('pw-login')?.textContent;

    if (!(usernameLogin && passwordLogin)) {
        console.error('Invalid credentials');
        return;
    }

    try {
        const result = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            body: JSON.stringify({ username: usernameLogin, password: passwordLogin, remember: true }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!result.ok) {
            throw new Error('Failed to find user');
        }

        window.location.href = await safeLink('index.html');
    } catch (e: any) {
        console.error('Login error:', e);
    }
}

const tryRegister = async () => {
    const username = document.getElementById('username-reg')?.textContent;
    const alias = document.getElementById('alias-reg')?.textContent;
    const email = document.getElementById('email-reg')?.textContent;
    const password = document.getElementById('pw-reg')?.textContent;
    const pwConfirm = document.getElementById('pw-confirm')?.textContent;

    if (!(username && alias && email && password && pwConfirm)) { 
        if (password !== pwConfirm) {
            /* Fail here too */
            console.error('Passwords must match');
            return;
        }

        console.error('All fields are required');
        /* Show error */ 
        return; 
    }

    await fetch(`${API_URL}/api/user`, {
        method: 'POST',
        body: JSON.stringify({ username, password, alias, email }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });

    tryLogin(username, password);
}

document.addEventListener('DOMContentLoaded', () => {
    const signInToggle = document.getElementById('sign-in-toggle');
    const signUpToggle = document.getElementById('sign-up-toggle');

    if (signInToggle && signUpToggle) {
        const [signInID, signUpID] = ['sign-in' ,'sign-up'];

        signInToggle.dataset.active = 'true';
        signUpToggle.dataset.active = 'false';

        signInToggle.addEventListener('click', () => {
            toggleInterface(signInToggle, signInID);
            toggleInterface(signUpToggle, signUpID);
        });

        signUpToggle.addEventListener('click', () => {
            toggleInterface(signUpToggle, signUpID);
            toggleInterface(signInToggle, signInID);
        })
    }

    const editables = document.querySelectorAll('div[contenteditable="true"]');
    for (const value of editables.values()) {
        value.setAttribute('spellcheck', 'false');
        value.addEventListener('input', (e) => {
            const div = value as HTMLDivElement;
            
            const input = e as InputEvent;
            if (input.inputType === 'insertParagraph' || input.inputType === 'insertLineBreak') {
                div.innerText = div.textContent; // Removes all newlines

                // Create the illusion that pressing 'Enter' does nothing
                const range = window.getSelection()?.getRangeAt(0);
                if (!range) { return; }

                range.setStart(range.commonAncestorContainer, div.textContent.length);
                range.collapse(true);
            }
        });
    }

    const signInButton = document.getElementById('sign-in-button');
    signInButton?.addEventListener('click', async () => await tryLogin());

    const registerButton = document.getElementById('register-button');
    registerButton?.addEventListener('click', async () => await tryRegister());

    buildComponents();
})