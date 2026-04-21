

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
export class SystemNavigationDTO {
    sistemas: Sistema[];
    constructor(sistemas: Sistema[]) {
        this.sistemas = sistemas;
    }
}
