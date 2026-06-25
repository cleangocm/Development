import 'package:flutter/material.dart';

class PaymentsTab extends StatelessWidget {
  const PaymentsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const _PlaceholderTab();
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab();

  @override
  Widget build(BuildContext context) {
    return const Center(child: Padding(padding: EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.account_balance_wallet_outlined, size: 64, color: Color(0xFF16A34A)),
      SizedBox(height: 18),
      Text('Payments', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
      SizedBox(height: 8),
      Text('Invoices, pending payments, and transaction history will appear here.', textAlign: TextAlign.center),
    ])));
  }
}