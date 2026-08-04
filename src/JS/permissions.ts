const tryAdminLoad = async (url: string) => {
    const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(getSession()),
        headers: { 'Content-Type': 'application/json' }
    });
    
    const redirect = await res.json();

    if (redirect.redirectTo) {
        console.log(redirect.redirectTo);
        window.location.href = redirect.redirectTo;
    } else {
        console.error('Load failed');
    }
};

const getSession = async () => {
    return { 
        session: window.localStorage.getItem('admin-test') 
    };
};

export const verify = (): boolean => {


    return true;
};