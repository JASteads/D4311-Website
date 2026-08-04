import { Components } from "./components";
import { API_URL } from "./config";

const toggleInterface = (toggle: HTMLElement, uiID: string) => {
    const ui = document.getElementById(uiID);

    let data = toggle.dataset;
    data.active = (data.active === 'true') ? 'false' : 'true';

    if (ui) {
        ui.style.display = (data.active === 'true') ? 'flex' : 'none';
    }
}

const tryLogin = async () => {
    console.log('boop');
}

const tryRegister = async () => {
    console.log('beep');
}

document.addEventListener('DOMContentLoaded', () => {
    const signInID = 'sign-in';
    const signUpID = 'sign-up';

    const signInToggle = document.getElementById('sign-in-toggle');
    const signUpToggle = document.getElementById('sign-up-toggle');

    if (signInToggle && signUpToggle) {
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

    const signInButton = document.getElementById('sign-in-button');
    signInButton?.addEventListener('click', tryLogin);

    const registerButton = document.getElementById('register-button');
    registerButton?.addEventListener('click', tryRegister);

    new Components();
})