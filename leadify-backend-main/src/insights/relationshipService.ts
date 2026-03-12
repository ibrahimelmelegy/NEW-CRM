import Deal from '../deal/model/dealModel';
import Lead from '../lead/leadModel';
import Client from '../client/clientModel';
import User from '../user/userModel';
import DealUsers from '../deal/model/deal_UsersModel';
import LeadUsers from '../lead/model/lead_UsersModel';

interface GraphNode {
  id: string;
  label: string;
  type: 'lead' | 'deal' | 'client' | 'user';
  value?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

class RelationshipService {
  async getGraph(filters?: { types?: string[] }): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();
    const types = filters?.types || ['lead', 'deal', 'client', 'user'];

    // Fetch users
    if (types.includes('user')) {
      const users = await User.findAll({ attributes: ['id', 'name'] });
      for (const u of users) {
        const id = `user-${u.id}`;
        nodes.push({ id, label: u.name, type: 'user' });
        nodeIds.add(id);
      }
    }

    // Fetch leads
    if (types.includes('lead')) {
      const leads = await Lead.findAll({
        attributes: ['id', 'name'],
        limit: 200
      });
      for (const l of leads) {
        const id = `lead-${l.id}`;
        nodes.push({ id, label: l.name, type: 'lead' });
        nodeIds.add(id);
      }

      // Lead-User edges
      if (types.includes('user')) {
        const leadUsers = await LeadUsers.findAll();
        for (const lu of leadUsers) {
          const leadId = `lead-${(lu as Record<string, unknown>).leadId}`;
          const userId = `user-${(lu as Record<string, unknown>).userId}`;
          if (nodeIds.has(leadId) && nodeIds.has(userId)) {
            edges.push({ source: userId, target: leadId, label: 'assigned' });
          }
        }
      }
    }

    // Fetch deals
    if (types.includes('deal')) {
      const deals = await Deal.findAll({
        attributes: ['id', 'name', 'price', 'leadId', 'clientId'],
        limit: 200
      });
      for (const d of deals) {
        const id = `deal-${d.id}`;
        nodes.push({ id, label: d.name, type: 'deal', value: d.price || 0 });
        nodeIds.add(id);

        // Deal-Lead edge
        if (d.leadId && types.includes('lead')) {
          const leadId = `lead-${d.leadId}`;
          if (nodeIds.has(leadId)) {
            edges.push({ source: leadId, target: id, label: 'converted' });
          }
        }

        // Deal-Client edge
        if (d.clientId && types.includes('client')) {
          const clientId = `client-${d.clientId}`;
          if (nodeIds.has(clientId)) {
            edges.push({ source: id, target: clientId, label: 'for' });
          }
        }
      }

      // Deal-User edges
      if (types.includes('user')) {
        const dealUsers = await DealUsers.findAll();
        for (const du of dealUsers) {
          const dealId = `deal-${(du as Record<string, unknown>).dealId}`;
          const userId = `user-${(du as Record<string, unknown>).userId}`;
          if (nodeIds.has(dealId) && nodeIds.has(userId)) {
            edges.push({ source: userId, target: dealId, label: 'works on' });
          }
        }
      }
    }

    // Fetch clients
    if (types.includes('client')) {
      const clients = await Client.findAll({
        attributes: ['id', 'companyName'],
        limit: 200
      });
      for (const c of clients) {
        const id = `client-${c.id}`;
        if (!nodeIds.has(id)) {
          nodes.push({ id, label: (c as Record<string, unknown>).companyName || `Client ${c.id}`, type: 'client' });
          nodeIds.add(id);
        }
      }
    }

    return { nodes, edges };
  }
}

export default new RelationshipService();
