import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Product, Sale, Receivable, Client } from '../types';

export function useData() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [prodRes, stockRes, saleRes, recRes, clientRes] = await Promise.all([
                supabase.from('productos').select('*'),
                supabase.from('stock_total_productos').select('id, stock_total'),
                supabase.from('ventas').select('*, items:venta_detalle(*)'),
                supabase.from('cuentas_por_cobrar').select('*, cliente:clientes(nombre)'),
                supabase.from('clientes').select('*')
            ]);

            if (prodRes.data) {
                const stockMap = new Map(stockRes.data?.map((s: any) => [s.id, s.stock_total]) || []);
                setProducts(prodRes.data.map((p: any) => ({
                    ...p,
                    stock_total: stockMap.get(p.id) || 0,
                    name: `${p.marca} ${p.modelo} ${p.medida}`
                })));
            }

            if (saleRes.data) {
                // Need to enable deep selection for items or join
                // For now, assuming direct mapping
                setSales(saleRes.data);
            }

            if (recRes.data) {
                setReceivables(recRes.data.map((r: any) => ({
                    ...r,
                    cliente_nombre: r.cliente?.nombre
                })));
            }

            if (clientRes.data) setClients(clientRes.data);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    // Transactional Sale
    async function processSale(saleData: any) {
        const { data, error } = await supabase.rpc('process_sale', saleData);
        if (error) throw error;
        await fetchData(); // Refresh data
        return data;
    }

    async function addProduct(product: Partial<Product>, initialStock: number = 0, initialCost: number = 0) {
        const { data: newProd, error } = await supabase.from('productos').insert({
            sku: product.sku,
            marca: product.marca,
            modelo: product.modelo,
            medida: product.medida,
            precio_venta_base: product.precio_venta_base,
            stock_minimo: product.stock_minimo || 10
        }).select().single();

        if (error) throw error;

        // If initial stock is provided, create the first lot
        if (initialStock > 0 && newProd) {
            const { error: lotError } = await supabase.from('lotes').insert({
                producto_id: newProd.id,
                cantidad_inicial: initialStock,
                cantidad_actual: initialStock,
                precio_compra: initialCost,
                fecha_importacion: new Date()
            });

            if (lotError) console.error("Error creating initial lot:", lotError);
            // We don't throw here to avoid failing the whole product creation if just the lot fails, 
            // but ideally this should be transactional. 
            // Since we don't have a multi-table transaction RPC ready for this specific case, 
            // we proceed.
        }

        await fetchData();
    }

    async function addClient(client: Partial<Client>) {
        const { error } = await supabase.from('clientes').insert({
            nombre: client.nombre,
            rnc_cedula: client.rnc_cedula,
            tipo: client.tipo,
            descuento_fijo: client.descuento_fijo,
            limite_credito: client.limite_credito,
            dias_credito: client.dias_credito
        });
        if (error) throw error;
        await fetchData();
    }

    async function registerLot(sku: string, qty: number, cost: number) {
        // Find product ID from SKU locally or DB
        const product = products.find(p => p.sku === sku);
        if (!product) throw new Error('Product not found');

        const { error } = await supabase.from('lotes').insert({
            producto_id: product.id,
            cantidad_inicial: qty,
            cantidad_actual: qty,
            precio_compra: cost,
            fecha_importacion: new Date()
        });
        if (error) throw error;
        await fetchData();
    }

    async function registerPayment(receivableId: string, amount: number) {
        const { error: payError } = await supabase.from('pagos').insert({
            cuenta_id: receivableId,
            monto: amount,
            metodo_pago: 'efectivo' // Default for now
        });
        if (payError) throw payError;

        // Manually update balance since no trigger exists for payments->receivables in setup yet
        const receivable = receivables.find(r => r.id === receivableId);
        if (receivable) {
            const newBalance = receivable.balance_pendiente - amount;
            const newStatus = newBalance <= 0 ? 'pagado' : receivable.estado;

            const { error: updateError } = await supabase.from('cuentas_por_cobrar')
                .update({
                    balance_pendiente: newBalance,
                    monto_pagado: (receivable.monto_pagado || 0) + amount,
                    estado: newStatus
                })
                .eq('id', receivableId);

            if (updateError) throw updateError;
        }
        await fetchData();
    }

    async function updateProduct(id: string, updates: Partial<Product>) {
        const { error } = await supabase.from('productos').update({
            sku: updates.sku,
            marca: updates.marca,
            modelo: updates.modelo,
            medida: updates.medida,
            precio_venta_base: updates.precio_venta_base,
            stock_minimo: updates.stock_minimo
        }).eq('id', id);

        if (error) throw error;
        await fetchData();
    }

    return {
        products, sales, receivables, clients, loading,
        processSale, addProduct, updateProduct, addClient, registerLot, registerPayment,
        refresh: fetchData
    };
}
