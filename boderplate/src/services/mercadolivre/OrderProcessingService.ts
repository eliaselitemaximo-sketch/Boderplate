import { ApiMlbService } from './mlb_api/ApiMlbService';
import { VendaCompletaRepository } from '../../repositories/mercadolivre/VendaCompletaRepository';
import logger from '../../utils/logger';

interface OrderData {
  order: any;
  shipment?: any;
  payment?: any;
}

interface PackData {
  packId: string;
  payment?: any;
  primaryOrder?: any;
}

export class OrderProcessingService {
  private apiService: ApiMlbService;
  private vendaRepository: VendaCompletaRepository;
  private delayBetweenRequests: number;

  constructor(
    apiService: ApiMlbService = new ApiMlbService(),
    vendaRepository: VendaCompletaRepository = new VendaCompletaRepository()
  ) {
    this.apiService = apiService;
    this.vendaRepository = vendaRepository;
    this.delayBetweenRequests = parseInt(process.env.API_DELAY || '200');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private formatDate(dateString?: string): string | null {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return null;
    }
  }

  private translateStatus(status?: string): string | null {
    if (!status) return null;
    const statusNormalized = status.toLowerCase().replace(/_/g, ' ');
    const translations: Record<string, string> = {
      paid: 'Pago',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      'in process': 'Em Processamento',
      pending: 'Pendente',
      refunded: 'Reembolsado',
      handling: 'Preparando Envio',
      'ready to ship': 'Pronto para Enviar',
      shipped: 'Enviado',
      delivered: 'Entregue',
      'not delivered': 'Não Entregue',
      'to be agreed': 'A Combinar',
      'in warehouse': 'No depósito',
      'creating route': 'Criando Rota',
      'ready for pickup': 'Pronto para Coleta (Transportadora)',
      'on its way': 'A Caminho',
      'out for delivery': 'Saiu para Entrega',
      'available for pickup': 'Disponível para Retirada (Agência)',
      'soon to be delivered': 'Chegando em Breve',
      claimed: 'Destinatário não encontrado',
      'not delivered yet': 'Ainda não entregue',
      'returning to sender': 'Retornando ao remetente',
      stolen: 'Extraviado/Roubado',
    };
    return translations[statusNormalized] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  private extractBuyerName(buyer: any): string | null {
    if (!buyer) return null;
    const firstName = buyer.first_name || buyer.firstname || '';
    const lastName = buyer.last_name || buyer.lastname || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || buyer.nickname || null;
  }

  async processOrder(orderId: string): Promise<void> {
    logger.info({ context: 'OrderProcessingService.processOrder', message: `Buscando dados da ordem: ${orderId}` });

    const orderData = await this.apiService.getOrder(orderId);
    if (!orderData) {
      throw new Error(`Falha ao buscar ordem ${orderId} (pode ter sido 404)`);
    }

    let shipmentData = null;
    if (orderData.shipping?.id) {
      await this.sleep(this.delayBetweenRequests);
      shipmentData = await this.apiService.getShipment(orderData.shipping.id);
    }

    let paymentData = null;
    if (orderData.payments?.[0]?.id) {
      await this.sleep(this.delayBetweenRequests);
      paymentData = await this.apiService.getPayment(orderData.payments[0].id);
    }

    const dadosCompletos = { order: orderData, shipment: shipmentData, payment: paymentData };
    await this.processarVenda(dadosCompletos);
  }

  async verifyRealPack(packId: string): Promise<boolean> {
    if (!packId) return false;

    try {
      const packData = await this.apiService.getPack(packId);
      if (!packData || !packData.orders || packData.orders.length === 0) {
        logger.warn({
          context: 'OrderProcessingService.verifyRealPack',
          message: `Não foi possível obter dados para o pack ${packId}`,
        });
        return false;
      }

      const uniqueItems = new Set<string>();

      for (const orderRef of packData.orders) {
        await this.sleep(this.delayBetweenRequests);
        const orderDetail = await this.apiService.getOrder(orderRef.id);
        if (orderDetail && orderDetail.order_items) {
          for (const item of orderDetail.order_items) {
            const itemId = item.item?.id || 'ID_INDISPONIVEL';
            const variationId = item.item?.variation_id || 'SEM_VARIACAO';
            uniqueItems.add(`${itemId}-${variationId}`);
          }
        }
      }

      const isRealPack = uniqueItems.size >= 2;
      logger.info({
        context: 'OrderProcessingService.verifyRealPack',
        message: `Pack ${packId} tem ${uniqueItems.size} itens únicos - É pacote real: ${isRealPack}`,
      });

      return isRealPack;
    } catch (error: any) {
      logger.error({
        context: 'OrderProcessingService.verifyRealPack',
        message: `Erro ao verificar pacote ${packId}: ${error.message}`,
        error: error.message,
      });
      return false;
    }
  }

  async processPack(packId: string): Promise<void> {
    logger.info({ context: 'OrderProcessingService.processPack', message: `Processando pacote completo: ${packId}` });

    const packData = await this.apiService.getPack(packId);
    if (!packData || !packData.orders || packData.orders.length === 0) {
      throw new Error(`Falha ao buscar dados do pacote ${packId}`);
    }

    await this.sleep(this.delayBetweenRequests);
    const primaryOrderRef = packData.orders[0];
    const primaryOrder = await this.apiService.getOrder(primaryOrderRef.id);

    if (!primaryOrder) {
      throw new Error(`Falha ao buscar ordem principal ${primaryOrderRef.id}`);
    }

    let paymentData = null;
    if (primaryOrder.payments?.[0]?.id) {
      await this.sleep(this.delayBetweenRequests);
      paymentData = await this.apiService.getPayment(primaryOrder.payments[0].id);
    }

    await this.processarPacote(packId, paymentData, primaryOrder);
  }

  private traduzirMetodoPagamento(metodo?: string): string {
    if (!metodo) return 'Não informado';
    const traducoes: Record<string, string> = {
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      ticket: 'Boleto Bancário',
      account_money: 'Dinheiro em Conta (Mercado Pago)',
      digital_currency: 'Mercado Crédito',
      bank_transfer: 'Transferência Bancária',
      pix: 'PIX',
    };
    return traducoes[metodo.toLowerCase()] || metodo.charAt(0).toUpperCase() + metodo.slice(1);
  }

  private traduzirTipoPagamento(tipo?: string): string {
    if (!tipo) return 'Não informado';
    const traducoes: Record<string, string> = {
      credit_card: 'Cartão de Crédito',
      account_money: 'Dinheiro em Conta',
      digital_currency: 'Moeda Digital',
    };
    return traducoes[tipo.toLowerCase()] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  private traduzirTipoAnuncio(tipo?: string): string {
    if (!tipo) return 'Não informado';
    const traducoes: Record<string, string> = {
      gold_pro: 'Premium',
      gold_special: 'Clássico',
      gold_premium: 'Premium',
    };
    return traducoes[tipo.toLowerCase()] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  private traduzirCanceladoPor(cancelDetail: any, statusDetail?: string): string | null {
    if (!cancelDetail) return null;
    const cancelledBy = (cancelDetail.cancelled_by || '').toLowerCase();
    const reason = (cancelDetail.reason || '').toLowerCase();
    const traducoes: Record<string, string> = {
      buyer: 'Comprador',
      seller: 'Vendedor',
      meli: 'Mercado Livre',
      mercadolibre: 'Mercado Livre',
      ml: 'Mercado Livre',
      admin: 'Mercado Livre (Administração)',
      system: 'Sistema',
      automatic: 'Sistema',
    };
    let responsavel = traducoes[cancelledBy] || cancelledBy.charAt(0).toUpperCase() + cancelledBy.slice(1);
    if (reason.includes('payment') || reason.includes('expired')) {
      if (['system', 'automatic', 'meli', 'ml'].includes(cancelledBy)) responsavel = 'Mercado Livre (Falta de Pagamento)';
    } else if (reason.includes('fraud')) {
      responsavel = 'Mercado Livre (Fraude Detectada)';
    } else if (reason.includes('stock') && cancelledBy === 'seller') {
      responsavel = 'Vendedor (Sem Estoque)';
    }
    if (statusDetail && statusDetail.toLowerCase().includes('expired') && !responsavel.includes('Pagamento')) {
      responsavel += ' (Prazo Expirado)';
    }
    return responsavel;
  }

  private formatarDetalhesPagamento(order: any, payment: any): { detalhe_parcelas: string | null } {
    const detalhes: { detalhe_parcelas: string | null } = { detalhe_parcelas: null };
    const installments = payment?.installments || 1;
    const totalPaid = order.paid_amount || payment?.total_paid_amount || 0;
    if (installments > 1 && totalPaid > 0) {
      const valorParcela = (totalPaid / installments).toFixed(2).replace('.', ',');
      detalhes.detalhe_parcelas = `${installments}x de R$ ${valorParcela}`;
    } else if (installments === 1 && totalPaid > 0) {
      const valorFormatado = totalPaid.toFixed(2).replace('.', ',');
      detalhes.detalhe_parcelas = `À vista (R$ ${valorFormatado})`;
    }
    return detalhes;
  }

  private async extrairDadosCancelamentoReembolso(order: any, payment: any): Promise<any> {
    const dados: any = {
      data_cancelamento: null,
      motivo_cancelamento: null,
      cancelado_por: null,
      tem_reembolso: false,
      valor_reembolsado: null,
      data_reembolso: null,
      id_reclamacao: null,
      motivo_reclamacao: null,
    };

    if (order.cancel_detail) {
      dados.data_cancelamento = this.formatDate(order.cancel_detail.date_created || order.date_closed);
      dados.motivo_cancelamento = order.cancel_detail.reason || 'Motivo não especificado';
      dados.cancelado_por = this.traduzirCanceladoPor(order.cancel_detail, order.status_detail);
    }

    if (payment && payment.refunds && Array.isArray(payment.refunds) && payment.refunds.length > 0) {
      dados.tem_reembolso = true;
      dados.valor_reembolsado = payment.refunds.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      dados.data_reembolso = this.formatDate(payment.refunds[0]?.date_created);
    }

    if (order.mediations && Array.isArray(order.mediations) && order.mediations.length > 0) {
      const mediationId = order.mediations[0].id;
      if (mediationId) {
        dados.id_reclamacao = mediationId;
        await this.sleep(this.delayBetweenRequests);
        const mediationData = await this.apiService.getMediation(mediationId);
        if (mediationData && mediationData.claims && mediationData.claims.length > 0) {
          dados.motivo_reclamacao = mediationData.claims[0].reason;
        }
      }
    }

    return dados;
  }

  private extrairDadosEnvio(shipmentDetails: any, order: any, payment: any): any {
    const shipping = order.shipping || {};
    const status = shipmentDetails?.status || shipping.status || null;
    const shippingAddress =
      shipmentDetails?.receiver_address ||
      shipmentDetails?.destination?.shipping_address ||
      shipping.receiver_address ||
      null;
    const substatus = shipmentDetails?.substatus || shipping.substatus || null;
    const trackingNumber = shipmentDetails?.tracking_number || shipping.tracking_number || null;
    const dateCreated = shipmentDetails?.date_created || shipping.date_created || null;
    const estimatedDelivery =
      shipmentDetails?.estimated_delivery_time?.date ||
      shipmentDetails?.shipping_option?.estimated_delivery_time?.date ||
      null;
    const dateDelivered = shipmentDetails?.status_history?.date_delivered || null;
    const costComprador = order.shipping?.cost || payment?.shipping_cost || 0;
    const costVendedor = order.order_costs?.shipping_fee || 0;
    const subsidioMl = order.order_costs?.seller_shipping_discount || 0;
    const custoReal = shipmentDetails?.lead_time?.list_cost || shipmentDetails?.shipping_option?.list_cost || 0;
    const tipoCusto = order.shipping?.cost_type || shipmentDetails?.cost_type || 'não informado';

    let quemPaga = 'Não Determinado';
    if (tipoCusto === 'not_free_shipping') {
      quemPaga = 'Comprador';
    } else if (tipoCusto === 'free_shipping') {
      if (costVendedor > 0 && subsidioMl === 0) {
        quemPaga = 'Vendedor';
      } else if (costVendedor > 0 && subsidioMl > 0) {
        quemPaga = 'Compartilhado';
      } else if (costVendedor === 0 && subsidioMl > 0) {
        quemPaga = 'Mercado Livre';
      } else {
        quemPaga = 'Vendedor (Frete Grátis)';
      }
    } else if (status === 'to_be_agreed') {
      quemPaga = 'A Combinar';
    }

    const logisticType = shipmentDetails?.logistic?.type || shipping.logistic_type || null;
    const transportadora =
      shipmentDetails?.carrier?.name ||
      shipmentDetails?.tracking_method ||
      shipping.shipping_method?.name ||
      logisticType;

    let cep = null,
      enderecoCompleto = null,
      cidade = null,
      estado = null,
      pais = null;
    if (shippingAddress) {
      cep = shippingAddress.zip_code || null;
      enderecoCompleto = shippingAddress.address_line || null;
      cidade = typeof shippingAddress.city === 'object' ? shippingAddress.city?.name : shippingAddress.city;
      estado = typeof shippingAddress.state === 'object' ? shippingAddress.state?.name : shippingAddress.state;
      pais = typeof shippingAddress.country === 'object' ? shippingAddress.country?.name : shippingAddress.country;
    }

    return {
      id: shipmentDetails?.id || shipping.id || null,
      status: this.translateStatus(status),
      substatus: this.translateStatus(substatus),
      metodo: logisticType,
      rastreio: trackingNumber,
      transportadora,
      cep,
      endereco: enderecoCompleto,
      cidade,
      estado,
      pais,
      dataCriacao: dateCreated,
      dataEstimada: estimatedDelivery,
      dataEntrega: dateDelivered,
      custo_vendedor: costVendedor,
      custo_comprador: costComprador,
      frete_pago_por: quemPaga,
      frete_subsidio_ml: subsidioMl,
      frete_custo_real: custoReal,
      frete_tipo_custo: tipoCusto,
    };
  }

  private async processarVenda(dadosCompletos: OrderData): Promise<void> {
    try {
      const order = dadosCompletos.order || {};
      const shipment = dadosCompletos.shipment || {};
      const payment = dadosCompletos.payment || order.payments?.[0] || {};
      const buyer = order.buyer || {};

      if (order.pack_id) {
        const isPacoteReal = await this.verifyRealPack(order.pack_id);
        if (isPacoteReal) {
          logger.info({
            context: 'OrderProcessingService.processarVenda',
            message: `Ordem ${order.id} pertence ao pacote REAL ${order.pack_id} - Processando pacote completo`,
          });
          await this.processarPacote(order.pack_id, payment, order);
          return;
        }
        logger.info({
          context: 'OrderProcessingService.processarVenda',
          message: `Venda ${order.id} - pack_id ${order.pack_id} é FALSO (1 item único), processando como venda individual`,
        });
      }

      const dadosEnvio = this.extrairDadosEnvio(shipment, order, payment);
      const taxaParcelamento = payment?.financing_fee?.amount || 0;
      const dadosCancelamento = await this.extrairDadosCancelamentoReembolso(order, payment);
      const detalhesPagamento = this.formatarDetalhesPagamento(order, payment);

      logger.info({
        context: 'OrderProcessingService.processarVenda',
        message: `Processando ${order.order_items?.length || 0} itens da ordem ${order.id}`,
      });

      for (const item of order.order_items || []) {
        const dadosComuns = {
          tipo_registro: 'venda_item',
          id_venda: order.id,
          mlb_anuncio: item.item?.id,
          pack_id: null,
          is_pacote: false,
          titulo_item: item.item?.title,
          sku: item.item?.seller_sku,
          quantidade: item.quantity,
          preco_unitario: item.unit_price,
          taxa_mlb_item: (item.sale_fee || 0) * (item.quantity || 1),
          tipo_anuncio: this.traduzirTipoAnuncio(item.listing_type_id),
          comprador_id: buyer.id,
          nome_comprador: this.extractBuyerName(buyer),
          status_venda: this.translateStatus(order.status),
          status_detalhe: order.status_detail,
          data_venda: this.formatDate(order.date_created),
          data_update: this.formatDate(order.last_updated),
          data_fechamento: this.formatDate(order.date_closed),
          total_venda_geral: order.total_amount,
          total_pago: order.paid_amount,
          moeda: order.currency_id,
          tipo_venda: order.context?.channel || 'marketplace',
          metodo_pagamento: this.traduzirMetodoPagamento(payment?.payment_method_id),
          tipo_pagamento: this.traduzirTipoPagamento(payment?.payment_type),
          parcelas: payment?.installments,
          taxa_parcelamento: taxaParcelamento,
          detalhe_parcelas: detalhesPagamento.detalhe_parcelas,
          momento_aprovacao: this.formatDate(payment?.date_approved),
          id_envio: dadosEnvio.id,
          status_envio: dadosEnvio.status,
          substatus_envio: dadosEnvio.substatus,
          rastreio_codigo: dadosEnvio.rastreio,
          transportadora: dadosEnvio.transportadora,
          cep: dadosEnvio.cep,
          endereco_completo: dadosEnvio.endereco,
          cidade: dadosEnvio.cidade,
          estado: dadosEnvio.estado,
          pais: dadosEnvio.pais,
          data_criacao_envio: this.formatDate(dadosEnvio.dataCriacao),
          data_estimada_entrega: this.formatDate(dadosEnvio.dataEstimada),
          data_entrega: this.formatDate(dadosEnvio.dataEntrega),
          frete_vendedor: dadosEnvio.custo_vendedor,
          frete_comprador: dadosEnvio.custo_comprador,
          frete_pago_por: dadosEnvio.frete_pago_por,
          frete_subsidio_ml: dadosEnvio.frete_subsidio_ml,
          frete_custo_real: dadosEnvio.frete_custo_real,
          frete_tipo_custo: dadosEnvio.frete_tipo_custo,
          ...dadosCancelamento,
        };

        await this.vendaRepository.salvarVenda(dadosComuns);
      }
    } catch (error: any) {
      logger.error({
        context: 'OrderProcessingService.processarVenda',
        message: `Erro ao processar venda: ${error.message}`,
        error: error.message,
      });
      throw error;
    }
  }

  private async processarPacote(packId: string, paymentData: any, primaryOrder: any): Promise<void> {
    try {
      logger.info({
        context: 'OrderProcessingService.processarPacote',
        message: `INICIANDO processamento do PACOTE ${packId}`,
      });

      const packData = await this.apiService.getPack(packId);
      if (!packData || !packData.orders || packData.orders.length === 0) {
        throw new Error(`Falha ao buscar dados do pacote ${packId} ou pacote sem ordens`);
      }

      logger.info({
        context: 'OrderProcessingService.processarPacote',
        message: `Pacote ${packId} contém ${packData.orders.length} ordem(ns)`,
      });

      if (!primaryOrder) {
        const primaryOrderRef = packData.orders[0];
        await this.sleep(this.delayBetweenRequests);
        primaryOrder = await this.apiService.getOrder(primaryOrderRef.id);
        if (!primaryOrder) {
          throw new Error(`Erro ao buscar ordem principal ${primaryOrderRef.id}`);
        }
      }

      const buyer = primaryOrder.buyer || {};
      const payment = primaryOrder.payments?.[0] || {};
      let shipmentData = null;
      if (primaryOrder.shipping?.id) {
        await this.sleep(this.delayBetweenRequests);
        shipmentData = await this.apiService.getShipment(primaryOrder.shipping.id);
      }

      const dadosEnvio = this.extrairDadosEnvio(shipmentData, primaryOrder, paymentData || payment);
      const dadosCancelamento = await this.extrairDadosCancelamentoReembolso(primaryOrder, paymentData || payment);
      const detalhesPagamento = this.formatarDetalhesPagamento(primaryOrder, paymentData || payment);

      let totalPacote = 0;
      let totalTaxaMlbItensPacote = 0;
      const itensParaSalvar: any[] = [];
      const ordensProcessadas = new Set<string>();
      const ordensComErro: any[] = [];
      const ordensTotal = packData.orders.length;

      for (let i = 0; i < ordensTotal; i++) {
        const orderRef = packData.orders[i];
        const orderId = orderRef.id;

        if (ordensProcessadas.has(orderId)) {
          logger.warn({
            context: 'OrderProcessingService.processarPacote',
            message: `Ordem ${orderId} duplicada, pulando...`,
          });
          continue;
        }

        if (i > 0) {
          await this.sleep(this.delayBetweenRequests);
        }

        try {
          const orderDetail = await this.apiService.getOrder(orderId);
          if (!orderDetail || !orderDetail.order_items || !Array.isArray(orderDetail.order_items) || orderDetail.order_items.length === 0) {
            throw new Error(`Ordem ${orderId} não possui itens válidos`);
          }

          ordensProcessadas.add(orderId);

          for (const item of orderDetail.order_items) {
            if (!item || !item.item || !item.item.id) continue;

            const quantidade = item.quantity || 1;
            const precoUnitario = item.unit_price || 0;
            const taxaItem = item.sale_fee || 0;
            const itemTotal = precoUnitario * quantidade;
            const itemTaxa = taxaItem * quantidade;

            totalPacote += itemTotal;
            totalTaxaMlbItensPacote += itemTaxa;

            itensParaSalvar.push({ order: orderDetail, item });
          }
        } catch (error: any) {
          ordensComErro.push({ orderId, erro: error.message });
          logger.error({
            context: 'OrderProcessingService.processarPacote',
            message: `Erro ao buscar ordem ${orderId}: ${error.message}`,
          });
        }
      }

      if (ordensComErro.length > 0 || ordensProcessadas.size !== ordensTotal || itensParaSalvar.length === 0) {
        throw new Error(
          `Falha ao coletar todas as ordens do pacote ${packId}. Ordens processadas: ${ordensProcessadas.size}/${ordensTotal}, Erros: ${ordensComErro.length}, Itens: ${itensParaSalvar.length}`
        );
      }

      const dadosPacote = {
        tipo_registro: 'pacote',
        pack_id: packId,
        id_venda: null,
        mlb_anuncio: null,
        total_venda_geral: totalPacote,
        is_pacote: true,
        comprador_id: buyer.id,
        nome_comprador: this.extractBuyerName(buyer),
        id_envio: dadosEnvio.id,
        status_envio: dadosEnvio.status,
        substatus_envio: dadosEnvio.substatus,
        rastreio_codigo: dadosEnvio.rastreio,
        transportadora: dadosEnvio.transportadora,
        cep: dadosEnvio.cep,
        endereco_completo: dadosEnvio.endereco,
        cidade: dadosEnvio.cidade,
        estado: dadosEnvio.estado,
        pais: dadosEnvio.pais,
        data_criacao_envio: this.formatDate(dadosEnvio.dataCriacao),
        data_estimada_entrega: this.formatDate(dadosEnvio.dataEstimada),
        data_entrega: this.formatDate(dadosEnvio.dataEntrega),
        frete_vendedor: dadosEnvio.custo_vendedor,
        frete_comprador: dadosEnvio.custo_comprador,
        frete_pago_por: dadosEnvio.frete_pago_por,
        frete_subsidio_ml: dadosEnvio.frete_subsidio_ml,
        frete_custo_real: dadosEnvio.frete_custo_real,
        frete_tipo_custo: dadosEnvio.frete_tipo_custo,
        tipo_anuncio: null,
        quantidade: itensParaSalvar.length,
        preco_unitario: null,
        taxa_mlb_item: totalTaxaMlbItensPacote,
        tipo_venda: primaryOrder.context?.channel || 'marketplace',
        data_venda: this.formatDate(primaryOrder.date_created),
        data_fechamento: this.formatDate(primaryOrder.date_closed),
        momento_aprovacao: this.formatDate(payment?.date_approved),
        metodo_pagamento: this.traduzirMetodoPagamento(payment?.payment_method_id),
        tipo_pagamento: this.traduzirTipoPagamento(payment?.payment_type),
        parcelas: payment?.installments,
        taxa_parcelamento: paymentData?.financing_fee?.amount || payment?.financing_fee?.amount || 0,
        detalhe_parcelas: detalhesPagamento.detalhe_parcelas,
        moeda: primaryOrder.currency_id,
        status_venda: this.translateStatus(primaryOrder.status),
        status_detalhe: primaryOrder.status_detail,
        titulo_item: `PACOTE - ${itensParaSalvar.length} itens`,
        sku: null,
        ...dadosCancelamento,
      };

      await this.vendaRepository.salvarVenda(dadosPacote);

      for (const { order, item } of itensParaSalvar) {
        const dadosItem = {
          tipo_registro: 'item_pacote',
          pack_id: packId,
          id_venda: order.id,
          mlb_anuncio: item.item?.id,
          titulo_item: item.item?.title,
          sku: item.item?.seller_sku,
          quantidade: item.quantity || 1,
          preco_unitario: item.unit_price || 0,
          status_venda: this.translateStatus(order.status),
          status_detalhe: order.status_detail,
          tipo_anuncio: this.traduzirTipoAnuncio(item.listing_type_id),
          taxa_mlb_item: (item.sale_fee || 0) * (item.quantity || 1),
          data_venda: this.formatDate(order.date_created),
          data_update: this.formatDate(order.last_updated),
          data_fechamento: this.formatDate(order.date_closed),
          is_pacote: true,
          comprador_id: buyer.id,
          nome_comprador: this.extractBuyerName(buyer),
          total_venda_geral: (item.unit_price || 0) * (item.quantity || 1),
          moeda: order.currency_id,
        };

        await this.vendaRepository.salvarVenda(dadosItem);
      }

      logger.info({
        context: 'OrderProcessingService.processarPacote',
        message: `PACOTE ${packId} PROCESSADO COM SUCESSO`,
      });
    } catch (error: any) {
      logger.error({
        context: 'OrderProcessingService.processarPacote',
        message: `ERRO CRÍTICO NO PACOTE ${packId}: ${error.message}`,
        error: error.message,
      });
      throw error;
    }
  }
}

