// indicator_config.dart

class IndicatorConfig {
  final String id;
  final String indicatorId;
  final String displayName;
  final String category; // 'main' | 'sub'
  final Map<String, dynamic> params;
  final String color;
  final bool favorite;

  const IndicatorConfig({
    required this.id,
    required this.indicatorId,
    required this.displayName,
    required this.category,
    required this.params,
    required this.color,
    this.favorite = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'indicatorId': indicatorId,
    'displayName': displayName,
    'category': category,
    'params': params,
    'color': color,
    'favorite': favorite,
  };

  factory IndicatorConfig.fromJson(Map<String, dynamic> json) => IndicatorConfig(
    id: json['id'] as String,
    indicatorId: json['indicatorId'] as String,
    displayName: json['displayName'] as String,
    category: json['category'] as String,
    params: Map<String, dynamic>.from(json['params'] as Map),
    color: json['color'] as String,
    favorite: json['favorite'] as bool? ?? false,
  );
}
