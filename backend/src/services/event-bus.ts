import { Server as SocketServer } from "socket.io";

export type EventType =
  | "payment"
  | "query_start"
  | "query_complete"
  | "agent_step"
  | "settlement"
  | "wallet_update";

export interface PaymentEvent {
  queryId: string;
  agentName: string;
  amount: number;
  timestamp: string;
  txIndex: number;
}

export interface QueryStartEvent {
  queryId: string;
  query: string;
  estimatedCost: number;
  complexity: number;
  timestamp: string;
}

export interface QueryCompleteEvent {
  queryId: string;
  actualCost: number;
  transactionCount: number;
  duration: number;
  timestamp: string;
}

export interface AgentStepEvent {
  queryId: string;
  agentName: string;
  status: "started" | "completed" | "failed";
  duration?: number;
  timestamp: string;
}

export class EventBus {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
  }

  emit(event: EventType, data: unknown): void {
    this.io.emit(event, data);
  }

  emitPayment(data: PaymentEvent): void {
    this.io.emit("payment", data);
  }

  emitQueryStart(data: QueryStartEvent): void {
    this.io.emit("query_start", data);
  }

  emitQueryComplete(data: QueryCompleteEvent): void {
    this.io.emit("query_complete", data);
  }

  emitAgentStep(data: AgentStepEvent): void {
    this.io.emit("agent_step", data);
  }
}
