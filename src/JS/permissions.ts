import type { Account } from "./account-manager";
// import { API_URL, DEV_URL } from "./config";

export const basicAdminAccessRequest = async (user: Account) => user.type === 'admin';

// export const requestAdminAccess = async (url: string) => {
//     const res = await fetch(url, {
//         method: 'POST',
//         body: JSON.stringify(getSession()),
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include'
//     });

//     return res.text();
// };

// export const tryAdminTest = () => {
//     const tryAdminLoad = async (url: string) => {
//         const res = await requestAdminAccess(url);
//         const redirect = JSON.parse(res);

//         if (redirect) {
//             window.location.href = redirect.redirectTo;
//         } else {
//             console.error('Load failed');
//         }
//     }
//     const adminStateTest = getSession();
//     let isAdmin = adminStateTest.session === 'true';

//     isAdmin = !isAdmin;
//     setSession(`${isAdmin}`);

//     if (window.location.href === `${DEV_URL}/admin_panel.html`) {
//         tryAdminLoad(`${API_URL}/api/admin_panel`);
//     } else {
//         window.location.reload();
//     }
// };

// export const getSession = () => {
//     if (!window.localStorage.getItem('admin-test')) {
//         console.warn('No admin test key. Making one...');
//         window.localStorage.setItem('admin-test', 'true');
//     }

//     return { session: window.localStorage.getItem('admin-test') };
// };

// const setSession = (value: string) => {
//     return window.localStorage.setItem('admin-test', value);
// };