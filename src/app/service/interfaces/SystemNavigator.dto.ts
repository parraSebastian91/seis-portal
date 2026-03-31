

export interface Sistema {
    nombre: string;
    ruta: string;
    descripcion: string;
    icono: string;
    modulos: Modulo[];
}

export interface Modulo {
    nombre: string;
    ruta: string;
    descripcion: string;
    icono: string;
    funcionalidades: Funcionalidad[];
}

export interface Funcionalidad {
    nombre: string;
    ruta: string;
    descripcion: string;
    icono: string;
    permisos: Permiso[];
}

export interface Permiso {
    codigo: string;
    nombre: string;
}

export interface Organizacion {
    nombre: string;
    uuid: string;
    sistemas: Sistema[];
}

export interface Contacto {
    nombres: string;
    usuario: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    avatar: string;
}

export class SystemNavigationDTO {
    organizacion: Organizacion[];
    contacto: Contacto;
    constructor(organizacion: Organizacion[], contacto: Contacto) {
        this.organizacion = organizacion;
        this.contacto = contacto;
    }
}
