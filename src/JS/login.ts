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

    document.getElementById('pw-reg')?.addEventListener('input', checkMatch);
    document.getElementById('pw-confirm')?.addEventListener('input', checkMatch);
})