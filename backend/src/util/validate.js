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
    price: /^(?!0(\.00?)?$)\d+(\.\d{1,2})?$/,
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
        if (!id) return 'Id inexistente.';
        if (!expregul.id.test(id)) return 'Id no válido.';
        return null;
    }
    static name(name) {
        name = String(name || '').trim().replace(/[<>"']/g, '');
        if (!name) return 'Nombre inexistente.';
        if (!expregul.name.test(name)) return 'Nombre no válido.';
        return null;
    }
    static rol(rol) {
        rol = String(rol || '').trim().replace(/[<>"']/g, '');
        if (!rol) return 'Nombre inexistente.';
        if (!expregul.rol.test(rol)) return 'Puesto no válido.';
        return null;
    }
    static location(location) {
        location = String(location || '').trim().replace(/[<>"']/g, '');
        if (!location) return 'Nombre inexistente.';
        if (!expregul.location.test(location)) return 'Nombre de sucursal no válido.';
        return null;
    }
    static last_name(last_name) {
        last_name = String(last_name || '').trim().replace(/[<>"']/g, '');
        if (!last_name) return 'Apellidos inexistentes.';
        if (!expregul.last_name.test(last_name)) return 'Apellido no válido.';
        return null;
    }
    static dni(dni) {
        dni = String(dni || '').trim().replace(/[<>"']/g, '');
        if (!dni) return 'DNI inexistente.';
        if (!expregul.dni.test(dni)) return 'El DNI debe tener exactamente 8 dígitos numéricos.';
        return null;
    }
    static ruc(ruc) {
        ruc = String(ruc || '').trim().replace(/[<>"']/g, '');
        if (!ruc) return null; // Permitir ruc vacío
        if (!expregul.ruc.test(ruc)) return 'El RUC debe tener exactamente 11 dígitos numéricos.';
        return null;
    }
    static rs(rs) {
        rs = String(rs || '').trim().replace(/[<>"']/g, '');
        if (!rs) return null; // Permitir rs vacío
        if (!expregul.rs.test(rs)) return 'La razón social contiene caracteres no permitidos.';
        return null;
    }
    static address(address) {
        address = String(address || '').trim().replace(/[<>"']/g, '');
        if (!address) return 'Dirección inexistente.';
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,#\-]+$/.test(address) || address.length < 3) {
            return 'La dirección debe tener al menos 3 caracteres y solo caracteres válidos.';
        }
        return null;
    }
    static email(email) {
        email = String(email || '').trim().toLowerCase();
        if (!email) return 'Email inexistente.';
        if (!expregul.email.test(email)) return 'Formato de email no válido.';
        return null;
    }
    static phone(phone) {
        phone = String(phone || '').trim().replace(/[^0-9]/g, '');
        if (!phone) return 'Teléfono inexistente.';
        if (!expregul.phone.test(phone)) return 'El teléfono debe tener entre 7 y 15 dígitos.';
        return null;
    }
    static password(password) {
        if (!password) return 'Password inexistente.';
        if (!expregul.password.test(password)) return 'El password debe tener más de 8 caracteres.';
        return null;
    }
    static amount(amount) {
        amount = String(amount ?? '').trim().replace(/[<>"']/g, '');
        if (!expregul.amount.test(amount)) return 'La cantidad debe ser un número mayor igual a cero.';
        return null;
    }
    static price(price) {
        price = String(price || '').trim().replace(/[<>"']/g, '');
        if (!price) return 'Monto inexistente.';
        if (!expregul.price.test(price)) return 'El monto debe ser un número positivo, con hasta 2 decimales y mayor que cero.';
        return null;
    }
    static dateHour(dateHour) {
        dateHour = String(dateHour || '').trim().replace(/[<>"']/g, '');
        if (!dateHour) return 'Fecha y hora inexistente.';
        if (!expregul.dateHour.test(dateHour)) return 'El formato debe ser YYYY-MM-DD HH:mm:ss (ej: 2024-05-13 14:30:45).';
        return null;
    }
    static booleano(valor) {
        if (typeof valor === 'boolean') return null;
        if (valor === 'true' || valor === 'false') return null;
        if (valor === 1 || valor === 0 || valor === '1' || valor === '0') return null;
        return 'El valor debe ser booleano (true/false o 1/0).';
    }
}