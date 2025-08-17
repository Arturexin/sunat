export const expregul = {
    // ID: acepta solo números positivos o cadena vacía
    id: /^$|^[1-9]\d*$/,
    // Solo letras y espacios y números
    location: /^[A-Za-z0-9 ]+$/,
    // Solo letras y espacios, mínimo 2 caracteres
    name: /^[A-Za-zÑñÁÉÍÓÚáéíóú'° ]{2,}$/,
    // Apellidos: solo letras y espacios, mínimo 2 caracteres
    last_name: /^[A-Za-zÑñÁÉÍÓÚáéíóú'° ]{2,}$/,
    // ...otras expresiones...
    ruc: /^\d{11}$/,
    // DNI: exactamente 8 dígitos
    dni: /^\d{8}$/,
    // Email: expresión simple y efectiva
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // Teléfono: solo números, mínimo 7 y máximo 15 dígitos
    phone: /^\d{7,15}$/,
    // Dirección: letras, números y algunos signos de puntuación
    address: /^[A-Za-zÑñÁÉÍÓÚáéíóú'°,.:/\d\- ]+$/,
    // salario: números positivos, hasta 2 decimales, no acepta ceros
    salary: /^(?!0(\.00?)?$)\d+(\.\d{1,2})?$/,
    // Cantidad: solo números enteros positivos y ceros
    amount: /^\d+$/,
    // Razón social: letras, números, espacios y algunos signos, mínimo 2 caracteres
    rs: /^[A-Za-zÑñÁÉÍÓÚáéíóú0-9'°&.,\-() ]{2,}$/,
    // Puesto de trabajo: letras, espacios y algunos signos, mínimo 2 caracteres
    rol: /^[A-Za-zÑñÁÉÍÓÚáéíóú'°\-() ]{2,}$/,
    // Password: mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
    // Booleano: acepta "true" o "false" (en minúsculas)
    booleano: /^(true|false)$/,
    // Fecha y hora: formato YYYY-MM-DD HH:mm:ss
    dateHour: /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
};
export class validation {
    static id(id) {
        id = String(id || '').trim().replace(/[<>"']/g, '');
        if (!expregul.id.test(id)) return {status: 'error', message: 'ID no válido.'};
        return id === '' ? '' : Number(id);
    }
    static location(location) {
        location = String(location || '').trim().replace(/[<>"']/g, '');
        if (!expregul.location.test(location)) return {status: 'error', message: 'Nombre de sucursal no válido.'} ;
        return location;
    }
    static name(name) {
        name = String(name || '').trim().replace(/[<>"']/g, '');
        if (!expregul.name.test(name)) return {status: 'error', message: 'Nombre no válido.'} ;
        return name;
    }
    static last_name(last_name) {
        last_name = String(last_name || '').trim().replace(/[<>"']/g, '');
        if (!expregul.last_name.test(last_name)) return {status: 'error', message: 'Apellido no válido.'};
        return last_name;
    }
    static ruc(ruc) {
        ruc = String(ruc || '').trim().replace(/[<>"']/g, '');
        if (!ruc) return ruc;
        if (!expregul.ruc.test(ruc)) return {status: 'error', message: 'RUC no válido.'};
        return ruc;
    }
    static salary(salary) {
        salary = String(salary || '').trim().replace(/[<>"']/g, '');
        if (!expregul.salary.test(salary)) return {status: 'error', message: 'Salario no válido.'} ;
        return Number(salary);
    }
    static dni(dni) {
        dni = String(dni || '').trim().replace(/[<>"']/g, '');
        if (!expregul.dni.test(dni)) return {status: 'error', message: 'DNI no válido.'} ;
        return dni;
    }
    static email(email) {
        email = String(email || '').trim().replace(/[<>"']/g, '');
        if (!expregul.email.test(email)) return {status: 'error', message: 'Email no válido.'} ;
        return email;
    }
    static phone(phone) {
        phone = String(phone || '').trim().replace(/[<>"']/g, '');
        if (!expregul.phone.test(phone)) return {status: 'error', message: 'Teléfono no válido.'} ;
        return phone;
    }
    static address(address) {
        address = String(address || '').trim().replace(/[<>"']/g, '');
        if (!expregul.address.test(address)) return {status: 'error', message: 'Dirección no válida.'} ;
        return address;
    }
    static amount(amount) {
        amount = String(amount ?? '').trim().replace(/[<>"']/g, '');
        if (!expregul.amount.test(amount)) return {status: 'error', message: 'Cantidad no válida.'} ;
        return Number(amount);
    }
    static rs(rs) {
        rs = String(rs || '').trim().replace(/[<>"']/g, '');
        if (!rs) return rs;
        if (!expregul.rs.test(rs)) return {status: 'error', message: 'Razón social no válida.'};
        return rs;
    }
    static rol(rol) {
        rol = String(rol || '').trim().replace(/[<>"']/g, '');
        if (!expregul.rol.test(rol)) return {status: 'error', message: 'Puesto de trabajo no válido.'};
        return rol;
    }
    static password(password) {
        password = String(password || '').trim();
        if (!expregul.password.test(password)) return {status: 'error', message: 'Contraseña no válida.'} ;
        return password;
    }
    static booleano(bool) {
        bool = String(bool).trim();
        if (!expregul.booleano.test(bool)) return {status: 'error', message: 'Valor booleano no válido.'} ;
        return bool === 'true';
    }
    static dateHour(dateHour) {
        dateHour = String(dateHour || '').trim();
        if (!expregul.dateHour.test(dateHour)) return {status: 'error', message: 'Fecha y hora no válidas.'} ;
        return dateHour;
    }
    // Agrega aquí más métodos según tus expresiones regulares
}
export function resetForm(campos){
    for (let campo in campos) {
        campos[campo] = '';
    }
};
export function validateRow(row) {
    for (const key in row) {
        if (row[key].status === 'error') {
            modalMessage(true, `Error en el campo ${key}: ${row[key].message}`, 'error');
            return false;
        }
    }
    return true;
}