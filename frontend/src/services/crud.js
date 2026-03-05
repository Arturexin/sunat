import { useDB } from "../stores/dataBases";
const URL_API_DB = 'http://localhost:3000/api/'
/* const URL_API_DB = import.meta.env.VITE_API_URL;
console.log(import.meta.env.VITE_API_URL)
console.log(import.meta.env.VITE_FRONT_BASE) */

async function fetchWithAutoRefresh(url, options = {}) {
    let response = await fetch(url, { ...options, credentials: 'include' });
    if (response.status === 401) {
        // Intentar renovar el token
        const refresh = await fetch(`${URL_API_DB}refresh-token`, {
            method: 'GET',
            credentials: 'include'
        });

        if (refresh.ok) {
            // Reintentar la petición original
            response = await fetch(url, { ...options, credentials: 'include' });
        }
    }
    return response;
}

export async function searchData(ruta) {
    const url = URL_API_DB + ruta
    try{
        const response = await fetchWithAutoRefresh(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error (errorData.message || 
                            `Error en la respuesta de la API: ${response.status} ${response.statusText}`
                            );
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    };
};

export async function sendData(ruta, row = null){
    let url = URL_API_DB + ruta;
    let options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'//***para el uso de cookies con token JWT***
    };
    if (row) options.body = JSON.stringify(row);

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error (errorData.message || 
                            `Error en la respuesta de la API: ${response.status} ${response.statusText}`
                            );
        }
        let data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

export async function updateData(ruta, row = null) {
    const url = URL_API_DB + ruta;
    const options = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',//***para el uso de cookies con token JWT***
    };
    if (row) options.body = JSON.stringify(row);
    
    try {
        const response = await fetchWithAutoRefresh(url, options);
        if (!response.ok) {
            const errorData = await response.json(); 
            throw new Error (errorData.message || 
                            `Error en la respuesta de la API: ${response.status} ${response.statusText}`
                            );
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export async function verifyAuth() {
    const dbStore = useDB();
    const verifyUrl = URL_API_DB + 'verify';
    const refreshUrl = URL_API_DB + 'refresh-token';

    try {
        // 1. Intentar verificar token de acceso
        let response = await fetch(verifyUrl, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            dbStore.isAuthLogin(data.user);
            return data.status === 'success';
        }

        // 2. Si falla, intentar renovar token con refresh_token
        const refresh = await fetch(refreshUrl, {
            method: 'GET',
            credentials: 'include'
        });

        if (!refresh.ok) {
            dbStore.clearDB();
            return false;
        }

        // 3. Si se renovó, reintentar verificar
        response = await fetch(verifyUrl, {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            dbStore.isAuthLogin(data.user);
            return data.status === 'success';
        } else {
            dbStore.clearDB();
            return false;
        }

    } catch (error) {
        dbStore.clearDB();
        return false;
    }
}
