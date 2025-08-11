// src/components/invoice/types/customer.ts
export interface Customer {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface OrderCustomer {
  namaPelanggan: string;
  alamatPelanggan?: string;
  telefonPelanggan?: string;
  emailPelanggan?: string;
}