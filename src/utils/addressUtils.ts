export const TIPOS_VIA = [
    "Calle", "Carrera", "Transversal", "Diagonal", "Circular", "Avenida", "Autopista"
];

export const LETRAS = [
    "", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "AA", "BB", "CC", "DD", "EE", "FF"
];

export const CARDINALES = [
    "", "Sur", "Norte", "Este", "Oeste"
];

export const TIPO_INMUEBLE = [
    "", "Apto", "Casa", "Oficina", "Local", "Bodega", "Interior", "Bloque", "Etapa", "Manzana"
];

export interface AddressState {
    via_tipo: string;
    via_numero: string;
    via_letra: string;
    via_bis: boolean;
    via_cardinal: string;
    cruce_numero: string;
    cruce_letra: string;
    cruce_cardinal: string;
    placa_numero: string;
    complemento_tipo: string;
    complemento_dato: string;
}

export const construirDireccionLegible = (dir: AddressState) => {
    // 1. Armar Vía Principal
    let resultado = `${dir.via_tipo} ${dir.via_numero}`;
    if (dir.via_letra) resultado += `${dir.via_letra}`;
    if (dir.via_bis) resultado += " Bis";
    if (dir.via_cardinal) resultado += ` ${dir.via_cardinal}`;

    // 2. Separador y Cruce
    resultado += ` # ${dir.cruce_numero}`;
    if (dir.cruce_letra) resultado += `${dir.cruce_letra}`;
    if (dir.cruce_cardinal) resultado += ` ${dir.cruce_cardinal}`;

    // 3. Placa
    resultado += ` - ${dir.placa_numero}`;

    // 4. Complemento
    if (dir.complemento_tipo && dir.complemento_dato) {
        resultado += `, ${dir.complemento_tipo} ${dir.complemento_dato}`;
    }

    return resultado.toUpperCase();
};
