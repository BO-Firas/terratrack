import 'package:flutter/material.dart';
import '../config.dart';

/// Logo TerraTrack - cible GPS
class TerraTrackLogo extends StatelessWidget {
  final double size;
  final Color? color;

  const TerraTrackLogo({super.key, this.size = 48, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.accent;
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _LogoPainter(color: c),
      ),
    );
  }
}

class _LogoPainter extends CustomPainter {
  final Color color;
  _LogoPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final unit = size.width / 100;

    // Anneaux concentriques
    canvas.drawCircle(
      center,
      40 * unit,
      Paint()
        ..color = color.withOpacity(0.15)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2 * unit,
    );
    canvas.drawCircle(
      center,
      28 * unit,
      Paint()
        ..color = color.withOpacity(0.5)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3 * unit,
    );
    canvas.drawCircle(
      center,
      16 * unit,
      Paint()
        ..color = color.withOpacity(0.85)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3 * unit,
    );

    // Point central
    canvas.drawCircle(
      center,
      6 * unit,
      Paint()..color = color,
    );

    // Croix de mire
    final crosshairPaint = Paint()
      ..color = color.withOpacity(0.4)
      ..strokeWidth = 2 * unit;

    canvas.drawLine(
      Offset(center.dx, 6 * unit),
      Offset(center.dx, 20 * unit),
      crosshairPaint,
    );
    canvas.drawLine(
      Offset(center.dx, 80 * unit),
      Offset(center.dx, 94 * unit),
      crosshairPaint,
    );
    canvas.drawLine(
      Offset(6 * unit, center.dy),
      Offset(20 * unit, center.dy),
      crosshairPaint,
    );
    canvas.drawLine(
      Offset(80 * unit, center.dy),
      Offset(94 * unit, center.dy),
      crosshairPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
