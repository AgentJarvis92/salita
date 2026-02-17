// Get all cookies and their properties
async function checkCookies() {
    const cookies = await cookieStore.getAll();
    return cookies.map(c => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        sameSite: c.sameSite,
        value: c.value.substring(0, 20) + '...'
    }));
}
checkCookies();
