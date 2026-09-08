import { buildComponents } from "./components";

const toggleInterface = (toggle: HTMLElement, uiID: string) => {
    const ui = document.getElementById(uiID);
    if (!ui) { return; }

    let data = toggle.dataset;
    data.active = (data.active === 'true') ? 'false' : 'true';
    ui.style.display = (data.active === 'true') ? 'flex' : 'none';
}

const checkMatch = () => {
    const password = document.getElementById('pw-reg') as HTMLInputElement;
    const pwConfirm = document.getElementById('pw-confirm') as HTMLInputElement;

    pwConfirm.setCustomValidity(password.value !== pwConfirm.value ? 'Passwords must match' : '');
}

document.addEventListener('DOMContentLoaded', async () => {
    await buildComponents();
    
    const signInToggle = document.getElementById('sign-in-toggle');
    const signUpToggle = document.getElementById('sign-up-toggle');
    const loginFail = document.getElementById('login-fail');
    const regFail = document.getElementById('reg-fail');
    const params = new URLSearchParams(location.search);

    // Toggling behaviors
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

        const mode = params.get('mode');
        if (mode === 'register') { signUpToggle.click(); }
    }

    // Error handling and presentation
    const error = params.get('error');
    if (loginFail && error === 'invalid') {
        loginFail.hidden = false;
        document.getElementById('login')?.addEventListener(
            'input', () => { loginFail.hidden = true; }, { once: true }
        );
        signInToggle?.addEventListener(
            'click', () => { loginFail.hidden = true; }, { once: true }
        );
    } else if (regFail && error === 'taken') {
        regFail.hidden = false;
        document.getElementById('reg')?.addEventListener(
            'input', () => { regFail.hidden = true; }, { once: true }
        );
        signUpToggle?.addEventListener(
            'click', () => { regFail.hidden = true; }, { once: true }
        );
    }

    document.getElementById('pw-reg')?.addEventListener('input', checkMatch);
    document.getElementById('pw-confirm')?.addEventListener('input', checkMatch);
})