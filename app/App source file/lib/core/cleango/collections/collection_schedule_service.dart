import 'package:ultrawash/core/cleango/models/collection.dart';

class CollectionScheduleException implements Exception {
  const CollectionScheduleException(this.message);

  final String message;

  @override
  String toString() => message;
}

class CollectionScheduleService {
  const CollectionScheduleService();

  static const yaoundeUtcOffset = Duration(hours: 1);
  static const supportedWeekdays = {
    DateTime.tuesday,
    DateTime.thursday,
    DateTime.friday,
    DateTime.saturday,
  };

  List<CollectionTimeWindow> get timeWindows =>
      List.unmodifiable(CollectionTimeWindow.values);

  bool isAvailableDate(DateTime date) {
    return supportedWeekdays.contains(date.weekday);
  }

  DateTime validateAndResolveUtc({
    required DateTime date,
    required CollectionTimeWindow timeWindow,
    DateTime? nowUtc,
  }) {
    final serviceDate = DateTime(date.year, date.month, date.day);
    if (!isAvailableDate(serviceDate)) {
      throw const CollectionScheduleException(
        'Collections are available Tuesday, Thursday, Friday, and Saturday.',
      );
    }

    final utcStart = DateTime.utc(
      serviceDate.year,
      serviceDate.month,
      serviceDate.day,
      timeWindow.startHour,
    ).subtract(yaoundeUtcOffset);
    final comparisonTime = (nowUtc ?? DateTime.now().toUtc()).toUtc();
    if (!utcStart.isAfter(comparisonTime)) {
      throw const CollectionScheduleException(
        'Choose a future collection date and time window.',
      );
    }
    return utcStart;
  }

  DateTime toServiceLocalDate(DateTime utcDate) {
    final serviceTime = utcDate.toUtc().add(yaoundeUtcOffset);
    return DateTime(
      serviceTime.year,
      serviceTime.month,
      serviceTime.day,
      serviceTime.hour,
      serviceTime.minute,
    );
  }

  DateTime firstAvailableDate({DateTime? nowUtc}) {
    final serviceNow = (nowUtc ?? DateTime.now().toUtc()).toUtc().add(
      yaoundeUtcOffset,
    );
    var candidate = DateTime(
      serviceNow.year,
      serviceNow.month,
      serviceNow.day,
    ).add(const Duration(days: 1));
    while (!isAvailableDate(candidate)) {
      candidate = candidate.add(const Duration(days: 1));
    }
    return candidate;
  }
}
