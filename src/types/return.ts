export type ReturnReason = 'SPOILED' | 'DAMAGED' | 'WRONG_ITEM' | 'QUALITY_ISSUE' | 'OTHER';
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export interface ReturnRequest {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName?: string;
  farmerId: string;
  reason: ReturnReason;
  description: string;
  proofImageUrl?: string;
  status: ReturnStatus;
  refundAmount: number;
  createdAt: string;
  rejectionReason?: string;
}

export interface SubmitReturnRequest {
  orderId: string;
  reason: ReturnReason;
  description: string;
  proofBase64?: string;
}
