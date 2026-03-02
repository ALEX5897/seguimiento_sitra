import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable para auto-refrescar datos periódicamente
 * @param {Function} fetchFn - Función async que carga los datos
 * @param {Number} interval - Intervalo en milisegundos (default: 30000 = 30seg)
 * @returns {Object} { isLoading, error, refresh }
 */
export function useAutoRefresh(fetchFn, interval = 30000) {
  const isLoading = ref(false);
  const error = ref(null);
  let refreshInterval = null;

  const refresh = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      await fetchFn();
      console.log('✓ Auto-refresh completado');
    } catch (err) {
      error.value = err.message;
      console.error('✗ Error en auto-refresh:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const startAutoRefresh = () => {
    if (refreshInterval) return;
    console.log(`Auto-refresh cada ${interval}ms`, new Date().toLocaleTimeString());
    refreshInterval = setInterval(refresh, interval);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      console.log('Auto-refresh detenido');
    }
  };

  onMounted(() => {
    startAutoRefresh();
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    isLoading,
    error,
    refresh,
    startAutoRefresh,
    stopAutoRefresh
  };
}
