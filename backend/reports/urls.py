from django.urls import path
from .views import DashboardSummaryView, ReportSummaryView, ExportThreatsCSVView

urlpatterns = [
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('reports/summary/', ReportSummaryView.as_view(), name='reports-summary'),
    path('reports/export-csv/', ExportThreatsCSVView.as_view(), name='reports-export-csv'),
]
