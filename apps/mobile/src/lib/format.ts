export const formatMoney = (value: number) => `${new Intl.NumberFormat('fr-CM').format(value)} FCFA`;
export const titleCase = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export const availabilityColor = (value: string) => value === 'AVAILABLE' ? '#16825D' : value === 'AVAILABLE_SOON' ? '#A05A00' : value === 'OCCUPIED' ? '#627067' : '#B42318';

