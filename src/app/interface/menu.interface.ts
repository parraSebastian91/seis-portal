export interface ISidebarMenu{
    icono: string;
    nombre: string;
    ruta?: string;
    subMenus?: IMenu[];
}


export interface IMenu {
    icono: string;
    nombre: string;
    ruta: string;
}
